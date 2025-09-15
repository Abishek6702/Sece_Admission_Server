module.exports = ({ studentName, email, password, frontendUrl }) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; background-color: #f9f9f9;">
    <div style="text-align: center; margin-bottom: 20px;">
      <img src="https://res.cloudinary.com/dfeplguf8/image/upload/v1757761491/sece-logo_fnwecc.png" alt="College Logo" style="width:120px; margin-bottom: 10px;" />
      <h2 style="color: #2c3e50;">Welcome to SECE Admission Portal</h2>
    </div>

    <p>Dear <b>${studentName}</b>,</p>
    <p>Please login using the credentials below:</p>

    <div style="background:#fff; border:1px solid #ddd; border-radius:6px; padding:12px; margin:20px 0;">
      <p><b>Email:</b> ${email}</p>
      <p><b>Password:</b> ${password}</p>
    </div>

    <p>🔑 Login here: <a href="${frontendUrl}/login">${frontendUrl}/login</a></p>

    <p style="text-align:center; margin-top:30px; color:#888;">
      Regards,<br>
      <b>SECE Admissions Team</b>
    </p>
  </div>
`;