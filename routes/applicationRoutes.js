const express = require("express");
const router = express.Router();
const upload = require("../middlewares/multerConfig");
const {
  createApplication,
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  bulkUpdateApplicationStatus,
  exportApplications,
  getApplicationStats,
  addRemark,
  resubmitApplication,
  getApplicationByUserId
} = require("../controllers/applicationController");

// Define file fields for upload
const fileFields = [
  { name: "studentPhoto", maxCount: 3 },
  { name: "fatherPhoto", maxCount: 3 },
  { name: "motherPhoto", maxCount: 3 },
  { name: "tenthMarkSheet", maxCount: 1 },
  { name: "eleventhMarkSheet", maxCount: 1 },
  { name: "twelthMarkSheet", maxCount: 1 },
  { name: "transferCertificate", maxCount: 1 },
  { name: "communityCertificate", maxCount: 1 },
  { name: "incomeCertificate", maxCount: 1 },
  { name: "migrationCertificate", maxCount: 1 },
  { name: "aadharCopy", maxCount: 1 },
  { name: "allotmentOrder", maxCount: 1 },
  { name: "firstGraduateCertificate", maxCount: 1 },
  { name: "declarationForm", maxCount: 1 },
  { name: "physicalFitnessForm", maxCount: 1 },
];

router.post("/", upload.fields(fileFields), createApplication);
router.get("/", getAllApplications);
router.get("/application-card", getApplicationStats);

router.get("/:id", getApplicationById);
router.patch("/:id/status", updateApplicationStatus);
router.put("/bulk/status", bulkUpdateApplicationStatus);
router.post("/export", exportApplications);
router.post("/:id/remark", addRemark);
router.put("/:id/resubmit", upload.fields(fileFields), resubmitApplication);
router.get("/user/:userId", getApplicationByUserId);

module.exports = router;
