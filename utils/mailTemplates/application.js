module.exports = (data) => {
  return `
  <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
    <div style="text-align: center;">
      <img src="https://res.cloudinary.com/dfeplguf8/image/upload/v1757761491/sece-logo_fnwecc.png" alt="SECE Logo" style="max-width: 150px;"/>
      <h2 style="color: #0056b3;">SECE Admission Application</h2>
    </div>
    
    <p>Dear ${data.studentName || "Student"},</p>
    <p>Your application has been successfully submitted. Below are the details:</p>

    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">Application ID</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${data._id}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">Course</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${data.preferredCourse || "-"}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">Quota</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${data.Quota || "-"}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">Community</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${data.community || "-"}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">Email</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${data.selfEmail || "-"}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">Mobile</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${data.selfMobileNo || "-"}</td>
      </tr>
    </table>

    <p>Please find attached your submitted application PDF for your reference.</p>

    <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #777;">
      <p>© ${new Date().getFullYear()} SECE Admissions</p>
    </div>
  </div>
  `;
};
