const Application = require("../models/Application");
const Enquiry = require("../models/Enquiry");
const mongoose = require("mongoose");

const getDashboardCounts = async (req, res) => {
  try {
    const totalEnquiries = await Enquiry.countDocuments();
    const totalApplications = await Application.countDocuments();
    const governmentQuota = await Application.countDocuments({
      Quota: "Government Quota",
    });
    const managementQuota = await Application.countDocuments({
      Quota: "Management Quota",
    });

    res.status(200).json({
      totalEnquiries,
      totalApplications,
      governmentQuota,
      managementQuota,
    });
  } catch (error) {
    console.error("Dashboard counts error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard counts" });
  }
};

const getYearlyQuotaCounts = async (req, res) => {
  try {
    const results = await Application.aggregate([
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, quota: "$Quota" },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.year",
          quotaCounts: {
            $push: { quota: "$_id.quota", count: "$count" },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Format the results as { year: { "Government Quota": count, "Management Quota": count } }
    const formatted = {};
    results.forEach(({ _id, quotaCounts }) => {
      formatted[_id] = {};
      quotaCounts.forEach(({ quota, count }) => {
        formatted[_id][quota] = count;
      });
    });

    res.status(200).json(formatted);
  } catch (error) {
    console.error("Yearly quota counts error:", error);
    res.status(500).json({ error: "Failed to fetch yearly quota counts" });
  }
};

const getYearlyDepartmentCounts = async (req, res) => {
  try {
    const results = await Application.aggregate([
      {
        $addFields: {
          // Split preferredCourse at the first space
          departmentParts: { $split: ["$preferredCourse", " "] },
        },
      },
      {
        $addFields: {
          mainDepartment: { $arrayElemAt: ["$departmentParts", 0] }, // e.g., "B.E"
          specialization: { $arrayElemAt: ["$departmentParts", 1] }, // e.g., "AI-ML"
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            mainDepartment: "$mainDepartment",
            specialization: "$specialization",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: {
            year: "$_id.year",
            mainDepartment: "$_id.mainDepartment",
          },
          specializations: {
            $push: {
              specialization: "$_id.specialization",
              count: "$count",
            },
          },
        },
      },
      {
        $group: {
          _id: "$_id.year",
          departments: {
            $push: {
              mainDepartment: "$_id.mainDepartment",
              specializations: "$specializations",
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Format output for frontend
    const formatted = {};
    results.forEach(({ _id: year, departments }) => {
      formatted[year] = {};
      departments.forEach(({ mainDepartment, specializations }) => {
        formatted[year][mainDepartment] = {};
        specializations.forEach(({ specialization, count }) => {
          if (specialization)
            formatted[year][mainDepartment][specialization] = count;
        });
      });
    });

    res.status(200).json(formatted);
  } catch (error) {
    console.error("Yearly department counts error:", error);
    res.status(500).json({ error: "Failed to fetch yearly department counts" });
  }
};

module.exports = {
  getDashboardCounts,
  getYearlyQuotaCounts,
  getYearlyDepartmentCounts,
};
