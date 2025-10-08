const Application = require("../models/Application");
const User = require("../models/User");
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const renderTemplate = require("../utils/templateHandler");
const sendMail = require("../utils/sendMail");
const applicationPdf = require("../utils/pdfTemplates/applicationPdf");
const ExcelJS = require("exceljs");

const baseUrl = process.env.BASE_URL || "http://localhost:5000";
const normalizePath = (filePath) => filePath.replace(/\\/g, "/");
const diffFields = require("../utils/diffFields");
exports.createApplication = async (req, res) => {
  try {
    const bodyData = req.body;
    const userId = bodyData.userId;

    // 1️⃣ Check if an application already exists
    const existingApp = await Application.findOne({ userId });
    if (existingApp) {
      return res.status(400).json({
        success: false,
        message: "Application already exists for this user",
        data: existingApp,
      });
    }

    // 2️⃣ Map uploaded files
    if (req.files) {
      if (req.files.studentPhoto)
        bodyData.studentPhoto = req.files.studentPhoto.map((f) =>
          normalizePath(f.path)
        );
      if (req.files.fatherPhoto)
        bodyData.fatherPhoto = req.files.fatherPhoto.map((f) =>
          normalizePath(f.path)
        );
      if (req.files.motherPhoto)
        bodyData.motherPhoto = req.files.motherPhoto.map((f) =>
          normalizePath(f.path)
        );
      if (req.files.tenthMarkSheet)
        bodyData.tenthMarkSheet = normalizePath(
          req.files.tenthMarkSheet[0].path
        );
      if (req.files.eleventhMarkSheet)
        bodyData.eleventhMarkSheet = normalizePath(
          req.files.eleventhMarkSheet[0].path
        );
      if (req.files.twelthMarkSheet)
        bodyData.twelthMarkSheet = normalizePath(
          req.files.twelthMarkSheet[0].path
        );
      if (req.files.transferCertificate)
        bodyData.transferCertificate = normalizePath(
          req.files.transferCertificate[0].path
        );
      if (req.files.communityCertificate)
        bodyData.communityCertificate = normalizePath(
          req.files.communityCertificate[0].path
        );
      if (req.files.incomeCertificate)
        bodyData.incomeCertificate = normalizePath(
          req.files.incomeCertificate[0].path
        );
      if (req.files.migrationCertificate)
        bodyData.migrationCertificate = normalizePath(
          req.files.migrationCertificate[0].path
        );
      if (req.files.aadharCopy)
        bodyData.aadharCopy = normalizePath(req.files.aadharCopy[0].path);
      if (req.files.allotmentOrder)
        bodyData.allotmentOrder = normalizePath(
          req.files.allotmentOrder[0].path
        );
      if (req.files.firstGraduateCertificate)
        bodyData.firstGraduateCertificate = normalizePath(
          req.files.firstGraduateCertificate[0].path
        );
      if (req.files.declarationForm)
        bodyData.declarationForm = normalizePath(
          req.files.declarationForm[0].path
        );
      if (req.files.physicalFitnessForm)
        bodyData.physicalFitnessForm = normalizePath(
          req.files.physicalFitnessForm[0].path
        );
    }

    // 3️⃣ Create and save application
    const application = new Application(bodyData);
    await application.save();

    // 4️⃣ Update user with application _id
    await User.findByIdAndUpdate(userId, { application: application._id });
    await User.findByIdAndUpdate(userId, { firstTimeLogin: false });

    // 5️⃣ Generate PDF and save
    const uploadsDir = path.join(__dirname, "../uploads/applicationmails");
    if (!fs.existsSync(uploadsDir))
      fs.mkdirSync(uploadsDir, { recursive: true });

    const fileName = `application_${application.studentName}_${Date.now()}.pdf`;
    const filePath = path.join(uploadsDir, fileName);
    const publicPath = `/uploads/applicationmails/${fileName}`;

    application.applicationPdfUrl = publicPath;
    await application.save();

    // You can create a custom PDF template function like renderPdfApplication
    await applicationPdf(application, filePath);

    const html = renderTemplate("application", application);
    await sendMail(
      application.selfEmail,
      "Your Application Submission - SECE Admission",
      html,
      filePath
    );

    res.status(201).json({
      success: true,
      message: "Application created, PDF generated, and email sent",
      data: application,
      pdfUrl: publicPath,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error creating application",
      error: error.message,
    });
  }
};

// Get all applications
exports.getAllApplications = async (req, res) => {
  try {
    const applications = await Application.find().populate("userId");
    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching applications",
      error: error.message,
    });
  }
};

// Get application by ID
exports.getApplicationById = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).populate(
      "userId"
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching application",
      error: error.message,
    });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Pending", "Admitted"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    res.json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.bulkUpdateApplicationStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ids must be a non-empty array" });
    }
    if (!["Pending", "Admitted"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }
    const result = await Application.updateMany(
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

exports.exportApplications = async (req, res) => {
  try {
    const { ids } = req.body;

    let applications;
    if (ids && ids.length > 0) {
      applications = await Application.find({ _id: { $in: ids } }).lean();
    } else {
      applications = await Application.find().lean();
    }

    if (!applications || applications.length === 0) {
      return res.status(404).json({ message: "No applications found" });
    }

    // Fields to remove from export
    const fieldsToRemove = [
      "remarks",
      "lastRemarkSnapshot",
      "_id",
      "userId"
    ];

    // Convert file paths to full URLs and handle arrays/objects
    const fileFields = [
      "studentPhoto",
      "fatherPhoto",
      "motherPhoto",
      "tenthMarkSheet",
      "eleventhMarkSheet",
      "twelthMarkSheet",
      "transferCertificate",
      "communityCertificate",
      "incomeCertificate",
      "migrationCertificate",
      "aadharCopy",
      "allotmentOrder",
      "firstGraduateCertificate",
      "declarationForm",
      "physicalFitnessForm",
      "applicationPdfUrl",
    ];

    function flattenField(value) {
      if (Array.isArray(value)) return value.join(", ");
      if (typeof value === "object" && value !== null) return JSON.stringify(value);
      return value;
    }

    applications = applications.map((app) => {
      const cleaned = {};
      Object.keys(app).forEach((key) => {
        if (!fieldsToRemove.includes(key)) {
          cleaned[key] = flattenField(app[key]);
        }
      });
      fileFields.forEach((field) => {
        if (cleaned[field]) {
          if (Array.isArray(app[field])) {
            cleaned[field] = app[field]
              .map((f) => (f.startsWith("http") ? f : `${baseUrl}/${f}`))
              .join(", ");
          } else {
            cleaned[field] = app[field].startsWith("http")
              ? app[field]
              : `${baseUrl}/${app[field]}`;
          }
        }
      });
      return cleaned;
    });

    // Create workbook & worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Applications");

    // Dynamically get all keys for columns
    const allKeys = new Set();
    applications.forEach((doc) => Object.keys(doc).forEach((k) => allKeys.add(k)));

    const columns = Array.from(allKeys).map((key) => ({
      header: key,
      key,
      width: 25,
    }));

    worksheet.columns = columns;

    // Add rows
    applications.forEach((doc) => worksheet.addRow(doc));

    // Set response headers for Excel export
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=applications.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Export applications error:", error);
    res.status(500).json({ message: error.message });
  }
};


exports.getApplicationStats = async (req, res) => {
  try {
    const totalApplications = await Application.countDocuments();
    const admittedApplications = await Application.countDocuments({
      status: { $in: ["Admitted"] },
    });
    const pendingApplications = await Application.countDocuments({
      status: { $in: ["Pending"] },
    });
    const remarkApplication = await Application.countDocuments({
      status: { $in: ["Remark"] },
    });
    res.json({
      totalApplications,
      admittedApplications,
      pendingApplications,
      remarkApplication,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addRemark = async (req, res) => {
  try {
    const { remark } = req.body;
    const { id } = req.params;

    const application = await Application.findById(id);
    if (!application) {
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });
    }

    // Check remark count
    if (application.remarks.length >= 3) {
      return res.status(400).json({
        success: false,
        message: "Maximum 3 remarks allowed for an application",
      });
    }

    // Push new remark
    application.remarks.push({ remark });
    application.status = "Remark";

    application.lastRemarkSnapshot = application.toObject();

    await application.save();

    const html = renderTemplate("remark", {
      studentName: application.studentName,
      remark: remark,
    });
    await sendMail(
      application.selfEmail,
      "Remark on Your Application - SECE Admission",
      html
    );

    res.json({
      success: true,
      message: "Remark added and email sent",
      data: application,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resubmitApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body }; // form fields from multipart/form-data

    const application = await Application.findById(id);
    if (!application) {
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });
    }
    const oldData = application.lastRemarkSnapshot || {};

    // ✅ Parse nested JSON fields
    const jsonFields = [
      "father",
      "mother",
      "guardian",
      "permanentAddress",
      "temporaryAddress",
      "siblingDetails",
    ];

    jsonFields.forEach((field) => {
      if (updates[field] && typeof updates[field] === "string") {
        try {
          updates[field] = JSON.parse(updates[field]);
        } catch (err) {
          console.error(`Failed to parse ${field}:`, err);
        }
      }
    });

    // Optional: prevent overwriting userId
    delete updates.userId;

    // 1️⃣ Update regular fields from form-data
    Object.assign(application, updates);

    // 2️⃣ Update files from form-data
    const normalizePath = (filePath) => filePath.replace(/\\/g, "/");

    const fileFields = [
      "studentPhoto",
      "fatherPhoto",
      "motherPhoto",
      "tenthMarkSheet",
      "eleventhMarkSheet",
      "twelthMarkSheet",
      "transferCertificate",
      "communityCertificate",
      "incomeCertificate",
      "migrationCertificate",
      "aadharCopy",
      "allotmentOrder",
      "firstGraduateCertificate",
      "declarationForm",
      "physicalFitnessForm",
    ];

    if (req.files) {
      fileFields.forEach((field) => {
        if (req.files[field]) {
          if (Array.isArray(req.files[field]) && req.files[field].length > 1) {
            application[field] = req.files[field].map((f) =>
              normalizePath(f.path)
            );
          } else {
            application[field] = normalizePath(req.files[field][0].path);
          }
        }
      });
    }

    const changedFields = diffFields(oldData, application.toObject());
    application.lastUpdatedFields = changedFields;

    // 3️⃣ Update status and submission count
    application.status = "Pending";
    application.submissionCount = (application.submissionCount || 0) + 1;

    // 4️⃣ Regenerate PDF
    const uploadsDir = path.join(__dirname, "../uploads/applicationmails");
    if (!fs.existsSync(uploadsDir))
      fs.mkdirSync(uploadsDir, { recursive: true });

    const fileName = `application_${application.studentName}_${Date.now()}.pdf`;
    const filePath = path.join(uploadsDir, fileName);
    const publicPath = `/uploads/applicationmails/${fileName}`;

    application.applicationPdfUrl = publicPath;
    await application.save();

    await applicationPdf(application, filePath);

    res.json({
      success: true,
      message: "Application resubmitted with form-data and PDF regenerated",
      data: { application, changedFields },
    });
  } catch (error) {
    console.error("Resubmit Application Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get application by User ID
exports.getApplicationByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const application = await Application.findOne({ userId }).populate(
      "userId"
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found for this user",
      });
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching application",
      error: error.message,
    });
  }
};
