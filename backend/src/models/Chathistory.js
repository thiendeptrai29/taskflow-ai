const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  time: { type: Date, default: Date.now }
});

const chatHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: String, required: true },
  title: { type: String, default: 'Cuộc trò chuyện mới' },
  messages: [messageSchema],
  lastMessage: { type: Date, default: Date.now }
}, { timestamps: true });

// Index để tìm nhanh theo user
chatHistorySchema.index({ user: 1, lastMessage: -1 });

module.exports = mongoose.model('ChatHistory', chatHistorySchema);