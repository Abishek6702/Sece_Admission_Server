const Staff = require('../models/Staff');

exports.getAllStaff = async (req, res) => {
  try {
    const staffList = await Staff.find({}, { name: 1, _id: 0 });
    res.status(200).json(staffList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createStaff = async (req, res) => {
  try {
    const staff = new Staff({ name: req.body.name });
    await staff.save();
    res.status(201).json(staff);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
