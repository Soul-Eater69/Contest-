const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  contest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contest',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  startedAt: {
    type: Date,
    default: null
  },
  hasStarted: {
    type: Boolean,
    default: false
  },
  hasCompleted: {
    type: Boolean,
    default: false
  }
});

// Compound index to ensure a user can only join a contest once
participantSchema.index({ contest: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Participant', participantSchema);
