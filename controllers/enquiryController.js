const Enquiry = require("../models/Enquiry");
const renderTemplate = require("../utils/templateHandler");
const sendMail = require("../utils/sendMail");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const renderPdf = require("../utils/pdfTemplates/enquiryPdf");
// Add new admission enquiry form
exports.createEnquiry = async (req, res) => {
  try {
    const {
      studentEmail,
      studentMobile,
      fatherEmail,
      fatherMobile,
      motherEmail,
      motherMobile,
    } = req.body;

    // Validating to prevent duplicate entries based on email and mobile
    const existing = await Enquiry.findOne({
      $or: [
        { studentEmail },
        { studentMobile },
        { fatherEmail },
        { fatherMobile },
        { motherEmail },
        { motherMobile },
      ],
    });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Duplicate entry: Email or Mobile already exists" });
    }
    const enquiry = new Enquiry(req.body);
    await enquiry.save();

    // pdf saving for future reference
    const uploadsDir = path.join(__dirname, "../uploads/enquiries");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    console.log("Uploads Directory:", uploadsDir);

    const fileName = `enquiry_${enquiry.studentName}.pdf`;

    const filePath = path.join(
      uploadsDir,
      fileName
    );

    const publicPath = `/uploads/enquiries/${fileName}`;
    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);
    renderPdf(doc, { ...req.body, _id: enquiry.studentName }); // call the template
    doc.end();

    writeStream.on("finish", () => {
      console.log(`Enquiry PDF saved: ${filePath}`);
    });

    const html = renderTemplate("enquiry", req.body);
    await sendMail(
      req.body.studentEmail,
      "Your SECE Admission Enquiry",
      html,
      filePath
    );

    res.status(201).json({
      message: "Enquiry created and email sent with PDF attached",
      enquiry,
      pdfUrl: publicPath,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all the enquiries
exports.getAllEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    res.json(enquiries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get enquiry of particular id
exports.getEnquiryById = async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ message: "Enquiry not found" });
    }
    res.json(enquiry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update enquiry status
exports.updateEnquiryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Pending", "Selected", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }
    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!enquiry) {
      return res.status(404).json({ message: "Enquiry not found" });
    }
    res.json(enquiry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
