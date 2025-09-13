const mongoose = require("mongoose");

const AddressSchema = new mongoose.Schema({
  doorNo: String,
  street: String,
  taluk: String,
  district: String,
  state: String,
  pincode: Number,
});

const EnquirySchema = new mongoose.Schema(
  {
    studentName: String,
    dob: Date,
    fatherName: String,
    motherName: String,
    isFirstGraduate: { type: Boolean, default: false },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    address: AddressSchema,
    community: String,
    courseRequired: [String],
    twelfthSchoolName: String,
    twelfthSchoolAddress: String,
    twelfthSchoolBoard: String,
    tenthSchoolBoard: String,
    tenthmarks: String,
    twelfthRegisterNo: String,
    twelfthMarks: {
      maths: Number,
      physics: Number,
      chemistry: Number,
      vocationalIfAny: Number,
      total:Number,
      cutOff: Number,
    },
    studentEmail: String,
    studentMobile: String,
    fatherEmail: String,
    fatherMobile: String,
    motherMobile: String,
    motherEmail: String,
    dateOfVisit: Date,
    signature: String,
    status: {
      type: String,
      enum: ["Pending", "Selected", "Rejected","UserCreated"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Enquiry", EnquirySchema);
