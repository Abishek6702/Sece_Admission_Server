const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // you can change if using other provider
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_PASS, // your app password
  },
});

const sendMail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    });
    console.log(`Mail sent to ${to}`);
  } catch (error) {
    console.error("Mail error:", error);
    throw error;
  }
};

module.exports = sendMail;
