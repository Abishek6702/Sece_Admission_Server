const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Enquiry = require("../models/Enquiry");
const sendMail = require("../utils/sendMail");
const generateToken = require("../utils/generateToken");
const renderTemplate = require("../utils/templateHandler");
exports.createUsersFromSelectedEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiry.find({ status: "Selected" });

    if (enquiries.length === 0) {
      return res.status(404).json({ messgae: "No selected enquiries found" });
    }
    const createdUsers = [];

    for (const enquiry of enquiries) {
      // console.log(enquiry);
      const existingUser = await User.findOne({ email: enquiry.studentEmail });
      if (existingUser) continue;

      const dob = new Date(enquiry.dob);
      console.log(dob);
      const day = String(dob.getDate()).padStart(2, "0");
      console.log(day);

      const month = String(dob.getMonth() + 1).padStart(2, "0");
      console.log(month);

      const passwordPlain = `Sece${day}${month}`;
      const hashedPassword = await bcrypt.hash(passwordPlain, 10);

      const user = new User({
        name: enquiry.studentName,
        email: enquiry.studentEmail,
        password: hashedPassword,
        role: "Student",
        firstTimeLogin: true,
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
    res.status(201).json({
      messgae: "Users created from selected  enquiries",
      count: createdUsers.length,
      createdUsers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ messgae: "Server error", error });
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
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
