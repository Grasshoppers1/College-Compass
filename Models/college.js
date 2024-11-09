const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  'Institute Name': { type: String, required: true },
  'Branch': { type: String, required: true },
  'Quota': { type: String, required: true },
  'SEAT TYPE': { type: String, required: true },
  'GENDER': { type: String, required: true },
  'OPEN RANK': { type: Number, required: true },
  'CLOSE RANK': { type: Number, required: true },
});

const College = mongoose.model('Name', collegeSchema);
module.exports = College;
