const ChatHistory = require('../models/ChatHistory');
const { v4: uuidv4 } = require('uuid');

// @desc Lấy tất cả session chat của user
// @route GET /api/chat/sessions
const getSessions = async (req, res) => {
  try {
    const sessions = await ChatHistory.find({ user: req.user._id })
      .select('sessionId title lastMessage createdAt messages')
      .sort('-lastMessage')
      .limit(20);

    // Trả về tóm tắt, không trả full messages
    const result = sessions.map(s => ({
      sessionId: s.sessionId,
      title: s.title,
      lastMessage: s.lastMessage,
      messageCount: s.messages.length,
      preview: s.messages[s.messages.length - 1]?.content?.slice(0, 80) || '',
      createdAt: s.createdAt
    }));

    res.json({ success: true, sessions: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Lấy chi tiết 1 session
// @route GET /api/chat/sessions/:sessionId
const getSession = async (req, res) => {
  try {
    const session = await ChatHistory.findOne({
      user: req.user._id,
      sessionId: req.params.sessionId
    });

    if (!session) return res.status(404).json({ success: false, message: 'Session không tồn tại' });

    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Tạo session mới
// @route POST /api/chat/sessions
const createSession = async (req, res) => {
  try {
    const sessionId = uuidv4();
    const session = await ChatHistory.create({
      user: req.user._id,
      sessionId,
      title: req.body.title || 'Cuộc trò chuyện mới',
      messages: []
    });

    res.status(201).json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Thêm messages vào session (save sau mỗi lượt chat)
// @route POST /api/chat/sessions/:sessionId/messages
const saveMessages = async (req, res) => {
  try {
    const { messages, title } = req.body;
    // messages = [{ role, content }]

    let session = await ChatHistory.findOne({
      user: req.user._id,
      sessionId: req.params.sessionId
    });

    if (!session) {
      // Tự tạo nếu chưa có
      session = new ChatHistory({
        user: req.user._id,
        sessionId: req.params.sessionId,
        title: title || 'Cuộc trò chuyện mới',
        messages: []
      });
    }

    // Thêm messages mới vào
    if (messages && messages.length > 0) {
      session.messages.push(...messages);
      session.lastMessage = new Date();

      // Auto tạo title từ tin nhắn đầu tiên của user nếu chưa có title ý nghĩa
      if (session.title === 'Cuộc trò chuyện mới' && messages[0]?.role === 'user') {
        session.title = messages[0].content.slice(0, 50);
      }
    }

    // Giới hạn tối đa 200 messages/session
    if (session.messages.length > 200) {
      session.messages = session.messages.slice(-200);
    }

    await session.save();
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Đổi tên session
// @route PUT /api/chat/sessions/:sessionId
const renameSession = async (req, res) => {
  try {
    const session = await ChatHistory.findOneAndUpdate(
      { user: req.user._id, sessionId: req.params.sessionId },
      { title: req.body.title },
      { new: true }
    );
    if (!session) return res.status(404).json({ success: false, message: 'Session không tồn tại' });
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Xóa session
// @route DELETE /api/chat/sessions/:sessionId
const deleteSession = async (req, res) => {
  try {
    await ChatHistory.findOneAndDelete({
      user: req.user._id,
      sessionId: req.params.sessionId
    });
    res.json({ success: true, message: 'Đã xóa session' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getSessions, getSession, createSession, saveMessages, renameSession, deleteSession };