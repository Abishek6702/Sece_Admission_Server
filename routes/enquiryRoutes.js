const express = require('express');
const router =express.Router();
const enquiryController = require("../controllers/enquiryController");

// Create new enquiry
router.post("/",enquiryController.createEnquiry);

// Get all enquiries
router.get("/",enquiryController.getAllEnquiries);

// Get enquiry by ID
router.get("/:id",enquiryController.getEnquiryById);

// Update enquiry status by ID
router.patch("/:id/status",enquiryController.updateEnquiryStatus);

router.put("/bulk/status",enquiryController.bulkUpdateEnquiryStatus);

module.exports = router;