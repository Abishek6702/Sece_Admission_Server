const express = require("express");

const School = require("../models/School.js");

const router = express.Router();

// GET /schools?search=
router.get("/", async (req, res) => {
  try {
    const search = req.query.search || "";
    const regex = new RegExp(search, "i");
    const schools = await School.find({ school_name: regex }).sort({ school_name: 1 });
    res.json(schools);
  } catch (err) {
    console.error("Error fetching schools:", err); // log actual error
    res.status(500).json({ error: "Server error", details: err.message });
  }
});


module.exports = router;
