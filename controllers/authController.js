const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const Enquiry = require("../models/Enquiry");

const sendMail = require("../utils/sendMail");
const generateToken = require("../utils/generateToken");
const renderTemplate = require("../utils/templateHandler");

exports.createUsersFromSelectedEnquiries = async (req, res) => {
  try {
    let { ids } = req.body;
    console.log("Received IDs from frontend:", ids);

    // Validate ids is an array if passed
    if (ids && !Array.isArray(ids)) {
      console.error("Invalid ids: not an array");
      return res.status(400).json({ message: "ids must be an array" });
    }

    let enquiries;
    if (ids && ids.length > 0) {
      const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));

      console.log("Finding enquiries with IDs and status 'Selected'");
      enquiries = await Enquiry.find({
        _id: { $in: objectIds },
        status: "Selected",
      });
    } else {
      console.log("No ids passed, finding all enquiries with status 'Selected'");
      enquiries = await Enquiry.find({ status: "Selected" });
    }
    console.log(`Number of eligible enquiries found: ${enquiries.length}`);

    if (enquiries.length === 0) {
      console.warn("No eligible enquiries found");
      return res.status(404).json({ message: "No eligible enquiries found" });
    }

    const createdUsers = [];

    for (const enquiry of enquiries) {
      console.log(`Processing enquiry id: ${enquiry._id}, email: ${enquiry.studentEmail}`);

      const existingUser = await User.findOne({ email: enquiry.studentEmail });
      if (existingUser) {
        console.log(`User already exists for email: ${enquiry.studentEmail}, skipping`);
        continue;
      }

      // Generate password from DOB
      const dob = new Date(enquiry.dob);
      const day = String(dob.getDate()).padStart(2, "0");
      const month = String(dob.getMonth() + 1).padStart(2, "0");

      const passwordPlain = `Sece${day}${month}`;
      const hashedPassword = await bcrypt.hash(passwordPlain, 10);

      // Create new user
      const user = new User({
        name: enquiry.studentName,
        email: enquiry.studentEmail,
        password: hashedPassword,
        role: "Student",
        firstTimeLogin: true,
        enquiry: enquiry._id,
      });
      await user.save();
      console.log("Created user:", user);

      try {
        // Update enquiry status
        enquiry.status = "UserCreated";
        await enquiry.save();
        console.log(`Updated enquiry status to UserCreated for id: ${enquiry._id}`);

        // Prepare welcome email content
        const BASE_URL = process.env.BASE_URL || "";
        const FRONTEND_URL = process.env.FRONTEND_URL || "";

        const html = renderTemplate("welcome", {
          studentName: enquiry.studentName,
          email: enquiry.studentEmail,
          password: passwordPlain,
          baseUrl: BASE_URL,
          frontendUrl: FRONTEND_URL,
        });

        await sendMail(enquiry.studentEmail, "Your College Admission Portal Login", html);
        console.log(`Sent welcome email to ${enquiry.studentEmail}`);
      } catch (emailErr) {
        console.error(
          `Failed to update status or send mail for enquiry id: ${enquiry._id}`,
          emailErr
        );
        // Optionally continue or return error here
      }

      createdUsers.push(user);
    }

    console.log(`Total users created: ${createdUsers.length}`);
    return res.status(201).json({
      message: "Users created successfully",
      count: createdUsers.length,
      createdUsers,
    });
  } catch (error) {
    console.error("Server error in createUsersFromSelectedEnquiries:", error);
    res.status(500).json({ message: "Server error", error });
  }
};


exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new User({
      name,
      email,
      password: hashedPassword,
      role: "Admin",
      firstTimeLogin: false,
    });

    await admin.save();

    res.status(201).json({ message: "Admin created", admin });
  } catch (err) {
    res.status(500).json({ message: "Error creating admin", err });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      firstTimeLogin: user.firstTimeLogin,
      token: generateToken(user._id, user.role, user.name,user.enquiry),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found for this email" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetOtp = otp;
    user.resetOtpExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();

    const htmlContent = renderTemplate("forgotPassword", {
      studentName: user.name,
      email: user.email,
      otp,
      frontendUrl: process.env.FRONTEND_URL,
    });

    await sendMail(
      email,
      "Password Reset OTP - SECE Admission Portal",
      htmlContent
    );

    res.json({ message: "Otp sent to mail" });
  } catch (error) {
    res.status(500).json({ messgae: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found for this email" });
    if (
      !user.resetOtp ||
      user.resetOtp != otp ||
      user.resetOtpExpiry < Date.now()
    ) {
      return res.status(404).json({ message: "Invalid or expired otp" });
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;

    await user.save();
    res.json({ message: "Password changed sucessfully" });
  } catch (error) {
    res.status(500).json({ message: error.mesaage });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found for this email" });
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();
    res.json({ mesaage: "Password changed sucessfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createStaff = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const staff = new User({
      name,
      email,
      password: hashedPassword,
      role: "Staff",      
      firstTimeLogin: false,
    });

    await staff.save();

    res.status(201).json({ message: "Staff user created", staff });
  } catch (err) {
    res.status(500).json({ message: "Error creating staff user", err });
  }
};
