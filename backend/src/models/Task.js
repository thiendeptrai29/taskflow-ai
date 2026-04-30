const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // ✅ Team task support
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  category: {
    type: String,
    default: 'general'
  },
  tags: [String],
  deadline: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  aiSuggested: {
    type: Boolean,
    default: false
  },
  aiScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  estimatedDuration: {
    type: Number,
    default: 30
  },
  actualDuration: {
    type: Number
  },
  subtasks: [{
    title: String,
    completed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  attachments: [{
    filename: String,
    path: String,
    mimetype: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now }
  }],
  notes: String,
  isRecurring: { type: Boolean, default: false },
  recurringPattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', null],
    default: null
  },
  notificationSent: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Index for performance
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ user: 1, deadline: 1 });
taskSchema.index({ user: 1, priority: 1 });
taskSchema.index({ team: 1, status: 1 }); // ✅ Team index

// Virtual for overdue check
taskSchema.virtual('isOverdue').get(function () {
  if (this.deadline && this.status !== 'completed') {
    return new Date() > this.deadline;
  }
  return false;
});

taskSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Task', taskSchema);