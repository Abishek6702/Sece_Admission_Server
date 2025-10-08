const fs = require("fs");
const PDFDocument = require("pdfkit");
const { PDFDocument: PDFLibDocument } = require("pdf-lib");
const path = require("path");

// Helper to normalize paths
const normalizePath = (p) => p.replace(/\\/g, "/");

const applicationPdf = async (application, outputPath) => {
  // 1️⃣ Create PDF document
  const doc = new PDFDocument({ margin: 50, compress: true });
  const writeStream = fs.createWriteStream(outputPath);
  doc.pipe(writeStream);

  doc.fontSize(20).text("Student Application", { align: "center" });
  doc.moveDown();

  // Student info
  doc.fontSize(14).text(`Student Name: ${application.studentName}`);
  doc.text(`Gender: ${application.gender}`);
  doc.text(`DOB: ${application.dob?.toISOString().split("T")[0]}`);
  doc.text(`Preferred Course: ${application.preferredCourse}`);
  doc.text(`Quota: ${application.Quota}`);
  doc.text(`Community: ${application.community}`);
  doc.text(`Caste: ${application.casteName}`);
  doc.text(`Blood Group: ${application.bloodGroup}`);
  doc.text(`Nationality: ${application.nationality}`);
  doc.moveDown();

  // Parents info
  doc.text(`Father: ${application.father?.name} (${application.father?.qualification})`);
  doc.text(`Mother: ${application.mother?.name} (${application.mother?.qualification})`);
  doc.text(`Guardian: ${application.guardian?.name || "N/A"}`);
  doc.moveDown();

  // Contact
  doc.text(`Email: ${application.selfEmail}`);
  doc.text(`Mobile: ${application.selfMobileNo}`);
  doc.moveDown();

  // Images
  const images = [
    ...(Array.isArray(application.studentPhoto) ? application.studentPhoto : []),
    ...(Array.isArray(application.fatherPhoto) ? application.fatherPhoto : []),
    ...(Array.isArray(application.motherPhoto) ? application.motherPhoto : []),
  ];

  images.forEach((imgPath, idx) => {
    if (fs.existsSync(imgPath)) {
      try {
        doc.addPage().image(imgPath, {
          fit: [400, 400],
          align: "center",
          valign: "center",
        });
      } catch (err) {
        console.log("Error adding image:", imgPath, err.message);
      }
    }
  });

  doc.moveDown();
  doc.text("Uploaded Documents:", { underline: true });

  // PDFs and other files
  const uploadedFiles = [
    application.tenthMarkSheet,
    application.eleventhMarkSheet,
    application.twelthMarkSheet,
    application.transferCertificate,
    application.communityCertificate,
    application.incomeCertificate,
    application.migrationCertificate,
    application.aadharCopy,
    application.allotmentOrder,
    application.firstGraduateCertificate,
    application.declarationForm,
    application.physicalFitnessForm,
  ].filter((f) => typeof f === "string" && fs.existsSync(f));

  uploadedFiles.forEach((file, idx) => {
    doc.text(`${idx + 1}. ${path.basename(file)}`);
  });

  doc.end();

  // Wait for PDFKit to finish
  await new Promise((resolve) => writeStream.on("finish", resolve));

  // Merge uploaded PDFs into main PDF
  const mainPdfBytes = fs.readFileSync(outputPath);
  const mergedPdf = await PDFLibDocument.load(mainPdfBytes);

  for (let file of uploadedFiles) {
    const ext = path.extname(file).toLowerCase();
    if (ext === ".pdf") {
      const pdfBytes = fs.readFileSync(file);
      const pdfToMerge = await PDFLibDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdfToMerge, pdfToMerge.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
  }

  const mergedPdfBytes = await mergedPdf.save();
  fs.writeFileSync(outputPath, mergedPdfBytes);
};

module.exports = applicationPdf;
