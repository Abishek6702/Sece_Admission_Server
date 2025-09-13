module.exports = (data) => {
  return `
  <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
    <div style="text-align: center;">
      <img src="https://res.cloudinary.com/dfeplguf8/image/upload/v1757761491/sece-logo_fnwecc.png" alt="SECE Logo" style="max-width: 150px;"/>
      <h2 style="color: #0056b3;">SECE Admission Enquiry</h2>
    </div>
    
    <p>Dear ${data.studentName || "Student"},</p>
    <p>Thank you for your enquiry. Here are the details you provided:</p>

    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">Email</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${data.studentEmail || "-"}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">Mobile</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${data.studentMobile || "-"}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">Father Email</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${data.fatherEmail || "-"}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">Father Mobile</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${data.fatherMobile || "-"}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">Mother Email</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${data.motherEmail || "-"}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">Mother Mobile</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${data.motherMobile || "-"}</td>
      </tr>
    </table>

    <p>We will get back to you soon regarding the admission process.</p>

    <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #777;">
      <p>© ${new Date().getFullYear()} SECE Admissions</p>
    </div>
  </div>
  `;
};
