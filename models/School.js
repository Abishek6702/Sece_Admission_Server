const mongoose = require("mongoose");

const SchoolSchema = new mongoose.Schema({
  school_name: { type: String, required: true, trim: true }
});


module.exports = mongoose.model("School", SchoolSchema);
