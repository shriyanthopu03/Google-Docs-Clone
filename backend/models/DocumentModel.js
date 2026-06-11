const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  title: { type: String, default: 'Untitled' },
  content: { type: Object, default: {} },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastSavedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model(
  "Document",
  documentSchema
);