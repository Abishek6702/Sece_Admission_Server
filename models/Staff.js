const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  name: { type: String, required: true }
});

module.exports = mongoose.model('Staff', staffSchema);
