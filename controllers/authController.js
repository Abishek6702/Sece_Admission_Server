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

    // If IDs are passed, validate them
    if (ids && !Array.isArray(ids)) {
      return res.status(400).json({ message: "ids must be an array" });
    }

    let enquiries;
    if (ids && ids.length > 0) {
    const objectIds = ids.map(id => new mongoose.Types.ObjectId(id));

      // Only process given IDs
      enquiries = await Enquiry.find({
        _id: { $in: objectIds },
        status: "Selected",
      });
    } else {
      // Fallback: process all selected enquiries
      enquiries = await Enquiry.find({ status: "Selected" });
    }

    if (enquiries.length === 0) {
      return res.status(404).json({ message: "No eligible enquiries found" });
    }

    const createdUsers = [];

    for (const enquiry of enquiries) {
      const existingUser = await User.findOne({ email: enquiry.studentEmail });
      if (existingUser) continue;

      // Password from DOB
      const dob = new Date(enquiry.dob);
      const day = String(dob.getDate()).padStart(2, "0");
      const month = String(dob.getMonth() + 1).padStart(2, "0");

      const passwordPlain = `Sece${day}${month}`;
      const hashedPassword = await bcrypt.hash(passwordPlain, 10);

      const user = new User({
        name: enquiry.studentName,
        email: enquiry.studentEmail,
        password: hashedPassword,
        role: "Student",
        firstTimeLogin: true,
        enquiry: enquiry._id,
      });
      await user.save();

      enquiry.status = "UserCreated";
      await enquiry.save();

      const BASE_URL = process.env.BASE_URL;
      const FRONTEND_URL = process.env.FRONTEND_URL;

      const html = renderTemplate("welcome", {
        studentName: enquiry.studentName,
        email: enquiry.studentEmail,
        password: passwordPlain,
        baseUrl: BASE_URL,
        frontendUrl: FRONTEND_URL,
      });

      await sendMail(
        enquiry.studentEmail,
        "Your College Admission Portal Login",
        html
      );

      createdUsers.push(user);
    }

    return res.status(201).json({
      message: "Users created successfully",
      count: createdUsers.length,
      createdUsers,
    });
  } catch (error) {
    console.error(error);
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
      token: generateToken(user._id, user.role, user.name),
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
