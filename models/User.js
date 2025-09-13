const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["Student", "Admin"], default: "Student" },
    firstTimeLogin: { type: Boolean, default: true },
    enquiry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enquiry",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
 