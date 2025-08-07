const mongoose = require('mongoose');

const MeetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  participants: [String], // List of emails
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  remindersSent: {
    oneDayBefore: { type: Boolean, default: false },
    oneHourBefore: { type: Boolean, default: false },
    fifteenMinsBefore: { type: Boolean, default: false }
  },
  status: { 
    type: String, 
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'], 
    default: 'scheduled' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Meeting', MeetingSchema);
