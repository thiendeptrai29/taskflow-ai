const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
  joinedAt: { type: Date, default: Date.now }
});

const inviteSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  role: { type: String, enum: ['admin', 'member'], default: 'member' },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now }
});

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'team_created',
      'team_updated',
      'member_invited',
      'member_joined',
      'member_removed',
      'role_updated',
      'task_created',
      'task_updated',
      'task_deleted',
      'task_progress_updated'
    ],
    default: 'team_updated'
  },
  message: { type: String, required: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true,
    minlength: [3, 'Min 3 chars'],
    maxlength: [100, 'Max 100 chars']
  },
  description: { type: String, trim: true, maxlength: [500, 'Max 500 chars'] },
  color: { type: String, default: '#06b6d4' },
  avatar: { type: String, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [memberSchema],
  invites: [inviteSchema],
  activities: [activitySchema]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

teamSchema.virtual('memberCount').get(function () {
  return this.members.length;
});

teamSchema.index({ 'members.user': 1 });
teamSchema.index({ createdBy: 1 });
teamSchema.index({ 'invites.email': 1, 'invites.status': 1 });
teamSchema.index({ 'activities.createdAt': -1 });

module.exports = mongoose.model('Team', teamSchema);
