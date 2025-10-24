const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

module.exports = (doc, data) => {
  // === Page setup ===
  const pageLeft = 45;
  const pageTop = 50;
  const pageWidth = 520;
  const rowHeight = 20; // slightly reduced for better fitting
  const boxHeight = 680; // reduced to fit 1 page

  // Outer border (fits single page)
  doc.rect(pageLeft, pageTop, pageWidth, boxHeight).stroke();

  // === Header ===
  doc.fontSize(14)
    .font('Helvetica-Bold')
    .text('Sri Eshwar College of Engineering, Coimbatore', pageLeft, pageTop + 10, { width: pageWidth, align: 'center' });

  doc.fontSize(12)
    .font('Helvetica')
    .text('Admission Enquiry Form (1st year)', pageLeft, pageTop + 30, { width: pageWidth, align: 'center' });

  // === Student Info Section ===
  doc.fontSize(10).font('Helvetica');
  let y = pageTop + 55;

  // Helper for clean rows
  function drawRow(leftLabel, leftValue, rightLabel, rightValue) {
    doc.text(leftLabel, pageLeft + 5, y + 5);
    doc.text(leftValue || '', pageLeft + 95, y + 5, { width: 120, ellipsis: true });
    doc.text(rightLabel, pageLeft + 240, y + 5);
    doc.text(rightValue || '', pageLeft + 320, y + 5, { width: 120, ellipsis: true });
    y += rowHeight;
    doc.moveTo(pageLeft, y).lineTo(pageLeft + pageWidth, y).stroke();
  }

  // --- Row 1: Student Name, DOB
  drawRow('Student Name:', data.studentName, 'DOB:', data.dob);

  // --- Row 2: Gender, Graduate
  drawRow('Gender:', data.gender, 'Graduate:', data.isFirstGraduate ? 'Yes' : 'No');

  // --- Row 3: Father Name, Mother Name
  drawRow('Father Name:', data.fatherName, 'Mother Name:', data.motherName);

  // --- Address row ---
  doc.text('Address:', pageLeft + 5, y + 5);
  doc.text(data.address?.doorNo || '', pageLeft + 65, y + 5, { width: pageWidth - 75, ellipsis: true });
  y += rowHeight;
  doc.moveTo(pageLeft, y).lineTo(pageLeft + pageWidth, y).stroke();

  // --- Community ---
  doc.text('Community (OC/BC/MBC/SCA/SC/ST):', pageLeft + 5, y + 5);
  doc.text(data.community || '', pageLeft + 210, y + 5);
  y += rowHeight;
  doc.moveTo(pageLeft, y).lineTo(pageLeft + pageWidth, y).stroke();

  // --- Course Required ---
  doc.text('Course Required:', pageLeft + 5, y + 5);
  doc.text(data.courseRequired ? data.courseRequired.join(', ') : '', pageLeft + 110, y + 5, { width: pageWidth - 120, ellipsis: true });
  y += rowHeight;
  doc.moveTo(pageLeft, y).lineTo(pageLeft + pageWidth, y).stroke();

  // === Academic Details Section ===
  doc.font('Helvetica-Bold').text('Academic Details:', pageLeft + 5, y + 5);
  doc.font('Helvetica');
  y += rowHeight;
  doc.moveTo(pageLeft, y).lineTo(pageLeft + pageWidth, y).stroke();

  // --- 12th School Name ---
  doc.text('12th School Name:', pageLeft + 5, y + 5);
  doc.text(data.twelfthSchoolName || '', pageLeft + 115, y + 5, { width: pageWidth - 120, ellipsis: true });
  y += rowHeight;
  doc.moveTo(pageLeft, y).lineTo(pageLeft + pageWidth, y).stroke();

  // --- 12th Board + School Address ---
  doc.text('12th Board:', pageLeft + 5, y + 5);
  doc.text(data.twelfthSchoolBoard || '', pageLeft + 70, y + 5, { width: 80, ellipsis: true });
  doc.text('12th School Address:', pageLeft + 180, y + 5);
  doc.text(data.twelfthSchoolAddress || '', pageLeft + 300, y + 5, { width: pageWidth - 310, ellipsis: true });
  y += rowHeight;
  doc.moveTo(pageLeft, y).lineTo(pageLeft + pageWidth, y).stroke();

  // === Marks Table (fixed width, well-spaced) ===
  const colWidths = [150, 120, 120]; // adjusted to fit page neatly
  const cellXs = [
    pageLeft,
    pageLeft + colWidths[0],
    pageLeft + colWidths[0] + colWidths[1],
  ];
  const tableStartY = y + 5;

  // Table headers
  doc.font('Helvetica-Bold').fontSize(9);
  doc.text('Subject', cellXs[0] + 5, tableStartY);
  doc.text('Marks', cellXs[1] + 5, tableStartY);
  doc.text('Out Of', cellXs[2] + 5, tableStartY);

  doc.font('Helvetica').fontSize(9);
  const subjects = [
    ['Maths', data.twelfthMarks?.maths || '', '100'],
    ['Physics', data.twelfthMarks?.physics || '', '100'],
    ['Chemistry', data.twelfthMarks?.chemistry || '', '100'],
    ['Vocational', data.twelfthMarks?.vocational || '', '100'],
    ['Total', data.twelfthMarks?.total || '', '600'],
    ['Cut Off', data.twelfthMarks?.cutOff || '', '200'],
  ];

  for (let i = 0; i < subjects.length; i++) {
    const [sub, mark, outof] = subjects[i];
    const cellY = tableStartY + (i + 1) * rowHeight;
    doc.text(sub, cellXs[0] + 5, cellY);
    doc.text(mark, cellXs[1] + 5, cellY);
    doc.text(`/ ${outof}`, cellXs[2] + 5, cellY);
    // draw horizontal line
    doc.moveTo(pageLeft, cellY + rowHeight - 2).lineTo(pageLeft + pageWidth, cellY + rowHeight - 2).stroke();
  }
  // vertical lines for table
  for (let i = 1; i < 3; i++) {
    doc.moveTo(cellXs[i], tableStartY - 2).lineTo(cellXs[i], tableStartY + subjects.length * rowHeight + rowHeight - 2).stroke();
  }
  y = tableStartY + subjects.length * rowHeight + rowHeight - 2;

  // --- 10th Board + Marks row ---
  doc.text('10th Board:', pageLeft + 5, y + 5);
  doc.text(data.tenthSchoolBoard || '', pageLeft + 70, y + 5, { width: 80 });
  doc.text('10th Marks:', pageLeft + 180, y + 5);
  doc.text(data.tenthMarks || '', pageLeft + 250, y + 5, { width: 100 });
  y += rowHeight;
  doc.moveTo(pageLeft, y).lineTo(pageLeft + pageWidth, y).stroke();

  // --- Date of Visit + Signature ---
  doc.text('Date of Visit:', pageLeft + 5, y + 5);
  doc.text(data.dateOfVisit || '', pageLeft + 85, y + 5);
  doc.text('Signature:', pageLeft + 180, y + 5);
  doc.text(data.signature ? 'Attached' : 'Not Provided', pageLeft + 250, y + 5);
  y += rowHeight;
  doc.moveTo(pageLeft, y).lineTo(pageLeft + pageWidth, y).stroke();

  // === For Office Use Only ===
  doc.font('Helvetica-Bold').fontSize(10).text('For Office Use Only:', pageLeft + 5, y + 5);
  y += rowHeight;
  doc.font('Helvetica').fontSize(9);
  doc.text('(CSF / AI-DS / AI-ML / CSE / ECE / EEE / Mech / Cyber Security):', pageLeft + 5, y + 5);
  y += rowHeight;
  doc.text('Admitted Department:', pageLeft + 5, y + 5);

  // === Footer ===
  doc.fontSize(9).fillColor('gray')
    .text('Generated by SECE Admission Portal', pageLeft, pageTop + boxHeight-20, { width: pageWidth, align: 'center' });
};
