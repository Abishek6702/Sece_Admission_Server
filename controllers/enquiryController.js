const Enquiry = require("../models/Enquiry");

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
    res.status(201).json(enquiry);
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
