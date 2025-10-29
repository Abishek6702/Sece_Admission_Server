const express = require("express");
const { getDashboardCounts, getYearlyQuotaCounts, getYearlyDepartmentCounts } = require("../controllers/dashboardController");

const router = express.Router();

router.get("/counts", getDashboardCounts);
router.get("/yearly-quota-counts", getYearlyQuotaCounts);
router.get("/yearly-department-counts", getYearlyDepartmentCounts);


module.exports = router;
