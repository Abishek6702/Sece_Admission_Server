const mongoose = require("mongoose");

const CounterSchema = new mongoose.Schema({
  id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});
const Counter = mongoose.model("Counter", CounterSchema);

async function getNextSequence(name) {
  const ret = await Counter.findOneAndUpdate(
    { id: name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return ret.seq;
}

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
    enquiryId: { type: String, unique: true },
    courseEntryType: {
      type: String,
      enum: ["I Year B.E / B.Tech", "Lateral Entry", "I Year M.E"],
      default: "I Year B.E / B.Tech",
    },
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
    tenthMarks: String,
    twelfthRegisterNo: String,
    twelfthMarks: {
      maths: Number,
      physics: Number,
      chemistry: Number,
      vocationalIfAny: Number,
      total: Number,
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
    allocatedStaff: { type: String },
    amount: { type: String },
    feesPaid: { type: Boolean },
    hasScholarship: { type: Boolean },
    scholarshipType: { type: String },
    transactionNo: { type: String },
    finalizedCourse: { type: String },
    rejectRemark:{type:String},
    allocatedQuota: {
      type: String,
      enum: ["Government Quota", "Management Quota"],
    
    },
    revisited: { type: Boolean, default: false },
    revisits: [
      {
        date: { type: Date },
        visitedBy: { type: String },
      },
    ],
    enquiryPdfUrl: { type: String },
    status: {
      type: String,
      enum: ["Pending", "Selected", "Rejected", "UserCreated"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

EnquirySchema.pre("save", async function (next) {
  if (this.isNew) {
    const prefix = "sece";
    const year1 = new Date().getFullYear() % 100;
    const year2 = (new Date().getFullYear() + 1) % 100;
    const yearString = `${year1}${year2}`;
    const fixedPart = "eq";

    const seqNumber = await getNextSequence("enquiry");
    const seqString = seqNumber.toString().padStart(4, "0");

    this.enquiryId = `${prefix}${yearString}${fixedPart}${seqString}`;
  }
  next();
});

module.exports = mongoose.model("Enquiry", EnquirySchema);
