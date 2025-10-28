const mongoose = require("mongoose");
const { ref } = require("pdfkit");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["Student", "Admin","Staff"], default: "Student" },
    firstTimeLogin: { type: Boolean, default: true },
    enquiry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enquiry",
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
    },
    resetOtp: { type: String },
    resetOtpExpiry: { type: Date },
    prefillData: {
      quota: String,
      finalizedCourse: String,
      courseEntryType: String,
      dod:Date,
      
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
