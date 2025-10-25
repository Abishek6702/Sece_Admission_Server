const Enquiry = require("../models/Enquiry");
const ExcelJS = require("exceljs");
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
      // studentEmail,
      studentMobile,
      // fatherEmail,
      fatherMobile,
      // motherEmail,
      motherMobile,
    } = req.body;
    console.log("working");

    // Validating to prevent duplicate entries based on email and mobile
    const existing = await Enquiry.findOne({
      $or: [
        // { studentEmail },
        { studentMobile },
        // { fatherEmail },
        { fatherMobile },
        // { motherEmail },
        { motherMobile },
      ],
    });
    console.log(existing);

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

    const filePath = path.join(uploadsDir, fileName);

    const publicPath = `/uploads/enquiries/${fileName}`;
    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);
    renderPdf(doc, { ...req.body, _id: enquiry.studentName }); // call the template
    doc.end();

    writeStream.on("finish", () => {
      console.log(`Enquiry PDF saved: ${filePath}`);
    });
    enquiry.enquiryPdfUrl = publicPath;
    await enquiry.save();

    // const html = renderTemplate("enquiry", req.body);
    // await sendMail(
    //   req.body.studentEmail,
    //   "Your SECE Admission Enquiry",
    //   html,
    //   filePath
    // );

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
// Update enquiry status AND other fields
exports.updateEnquiryStatus = async (req, res) => {
  try {
    // Destructure fields you want to allow updating
    const {
      status,
      allocatedStaff,
      amount,
      feesPaid,
      hasScholarship,
      scholarshipType,
      transactionNo,
      finalizedCourse,
      allocatedQuota,
      rejectRemark,
    } = req.body;

    // Validate status if provided
    if (status && !["Pending", "Selected", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Build update object dynamically
    const update = {};
    if (status) update.status = status;
    if (allocatedStaff !== undefined) update.allocatedStaff = allocatedStaff;
    if (amount !== undefined) update.amount = amount;
    if (feesPaid !== undefined) update.feesPaid = feesPaid;
    if (hasScholarship !== undefined) update.hasScholarship = hasScholarship;
    if (scholarshipType !== undefined) update.scholarshipType = scholarshipType;
    if (transactionNo !== undefined) update.transactionNo = transactionNo;
    if (finalizedCourse !== undefined) update.finalizedCourse = finalizedCourse;
    if(allocatedQuota!== undefined) update.allocatedQuota=allocatedQuota;
    if(rejectRemark!== undefined) update.rejectRemark=rejectRemark;


    const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });

    if (!enquiry) {
      return res.status(404).json({ message: "Enquiry not found" });
    }
    res.json(enquiry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update bulk ststus
exports.bulkUpdateEnquiryStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;

    // Validate inputs
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ids must be a non-empty array" });
    }

    if (!["Pending", "Selected", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Update multiple documents at once
    const result = await Enquiry.updateMany(
      { _id: { $in: ids } },
      { $set: { status } }
    );

    res.json({
      message: "Status updated successfully",
      matchedCount: result.matchedCount, // how many matched
      modifiedCount: result.modifiedCount, // how many actually updated
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export enquiries to Excel
exports.exportEnquiries = async (req, res) => {
  try {
    const { ids } = req.body;

    let enquiries;
    if (ids && ids.length > 0) {
      enquiries = await Enquiry.find({ _id: { $in: ids } }).lean();
    } else {
      enquiries = await Enquiry.find().lean();
    }

    if (!enquiries || enquiries.length === 0) {
      return res.status(404).json({ message: "No enquiries found" });
    }

    // Create workbook & sheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Enquiries");

    // Dynamically get all unique keys from the documents
    const allKeys = new Set();
    enquiries.forEach((doc) => {
      Object.keys(doc).forEach((key) => allKeys.add(key));
    });

    const columns = Array.from(allKeys).map((key) => ({
      header: key,
      key,
      width: 25,
    }));

    worksheet.columns = columns;

    // Add rows
    enquiries.forEach((doc) => {
      worksheet.addRow(doc);
    });

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=enquiries.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Enquiry Card Data
exports.getEnquiryStats = async (req, res) => {
  try {
    // Total enquiries
    const totalEnquiries = await Enquiry.countDocuments();
    // consol.log(totalEnquiries);
    // Count by status
    const selectedEnquiries = await Enquiry.countDocuments({
      status: { $in: ["Selected", "UserCreated"] },
    });

    const pendingEnquiries = await Enquiry.countDocuments({
      status: "Pending",
    });
    const rejectedEnquiries = await Enquiry.countDocuments({
      status: "Rejected",
    });

    res.json({
      totalEnquiries,
      selectedEnquiries,
      pendingEnquiries,
      rejectedEnquiries,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addRevisit = async (req, res) => {
  try {
    const { date, visitedBy } = req.body;

    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ message: "Enquiry not found" });
    }

    enquiry.revisits.push({ date, visitedBy });

    if (!enquiry.revisited && enquiry.revisits.length === 1) {
      enquiry.revisited = true;
    }

    await enquiry.save();

    res.json({
      message: "Revisit recorded successfully",
      revisited: enquiry.revisited,
      revisits: enquiry.revisits,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRevisitedCount = async (req, res) => {
  try {
    const revisitedCount = await Enquiry.countDocuments({ revisited: true });
    res.json({ revisitedCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getScholarshipCount = async (req, res) => {
  try {
    // Count enquiries with and without scholarship
    const [scholarshipCount, nonScholarshipCount] = await Promise.all([
      Enquiry.countDocuments({ hasScholarship: true }),
      Enquiry.countDocuments({ hasScholarship: false }),
    ]);

    res.status(200).json({
      scholarshipCount,
      nonScholarshipCount,
    });
  } catch (error) {
    console.error("Error fetching scholarship counts:", error);
    res.status(500).json({ message: "Failed to fetch scholarship counts" });
  }
};

// Update enquiry by ID
exports.updateEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const bodyData = req.body;

    // 1️⃣ Find existing enquiry
    const existingEnquiry = await Enquiry.findById(id);
    if (!existingEnquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found",
      });
    }

    // 2️⃣ Clean and prepare update data
    const updateData = {};

    // Fields to exclude from update
    const excludeFields = [
      '_id',
      '__v',
      'createdAt',
      'updatedAt',
      'enquiryPdfUrl'
    ];

    // Copy all fields except excluded ones
    for (const key in bodyData) {
      if (!excludeFields.includes(key)) {
        updateData[key] = bodyData[key];
      }
    }

    console.log("Update data for enquiry:", updateData);

    // 3️⃣ Update enquiry
    const updatedEnquiry = await Enquiry.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedEnquiry) {
      return res.status(404).json({
        success: false,
        message: "Failed to update enquiry",
      });
    }

    // 4️⃣ Regenerate PDF
    const uploadsDir = path.join(__dirname, "../uploads/enquiries");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileName = `enquiry_${updatedEnquiry.studentName}_${Date.now()}.pdf`;
    const filePath = path.join(uploadsDir, fileName);
    const publicPath = `/uploads/enquiries/${fileName}`;

    // Delete old PDF if exists
    if (existingEnquiry.enquiryPdfUrl) {
      const oldPdfPath = path.join(
        __dirname,
        "..",
        existingEnquiry.enquiryPdfUrl
      );
      if (fs.existsSync(oldPdfPath)) {
        fs.unlinkSync(oldPdfPath);
        console.log(`✅ Deleted old PDF: ${oldPdfPath}`);
      }
    }

    // Generate new PDF
    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);
    renderPdf(doc, { ...updatedEnquiry.toObject(), _id: updatedEnquiry.studentName });
    doc.end();

    // Wait for PDF to finish writing
    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    // Update enquiry with new PDF URL
    updatedEnquiry.enquiryPdfUrl = publicPath;
    await updatedEnquiry.save();

    console.log(`✅ New enquiry PDF saved: ${filePath}`);

   

    res.status(200).json({
      success: true,
      message: "Enquiry updated successfully and PDF regenerated",
      data: updatedEnquiry,
      pdfUrl: publicPath,
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating enquiry",
      error: error.message,
    });
  }
};

