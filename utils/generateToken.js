const jwt = require("jsonwebtoken");

const generateToken = (id, role,name,enquiry) => {
  return jwt.sign({ id, role, name,enquiry }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

module.exports = generateToken;
