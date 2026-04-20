const Groq = require('groq-sdk');
const Task = require('../models/Task');

// Khởi tạo Groq client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.1-8b-instant'; // Free, nhanh, thông minh

// Helper: Lấy userId an toàn
const getUserId = (req) => req.user?._id || req.user?.id || null;

// Helper: Get user context
const getUserContext = async (userId) => {
  if (!userId) return { totalTasks: 0, pendingTasks: 0, completedTasks: 0, overdueTasks: 0, recentTasks: [] };

  const tasks = await Task.find({ user: userId }).sort('-createdAt').limit(50);
  const pending = tasks.filter(t => t.status === 'pending');
  const completed = tasks.filter(t => t.status === 'completed');
  const overdue = pending.filter(t => t.deadline && new Date() > t.deadline);

  return {
    totalTasks: tasks.length,
    pendingTasks: pending.length,
    completedTasks: completed.length,
    overdueTasks: overdue.length,
    recentTasks: tasks.slice(0, 10).map(t => ({
      title: t.title, status: t.status, priority: t.priority,
      deadline: t.deadline, category: t.category
    }))
  };
};

// Helper: Gọi Groq lấy text
const callGroqText = async (systemPrompt, userMessage) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'gsk_your_key_here') {
    throw new Error('GROQ_API_KEY chưa được cấu hình trong .env');
  }
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    max_tokens: 1024,
    temperature: 0.7
  });
  return completion.choices[0].message.content;
};

// Helper: Gọi Groq và parse JSON
const callGroqJSON = async (systemPrompt, userMessage) => {
  const text = await callGroqText(systemPrompt, userMessage);
  // Xóa markdown code block nếu có
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    return JSON.parse(clean);
  } catch {
    // Thử tìm JSON trong text
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('AI trả về định dạng không hợp lệ, thử lại');
  }
};

// Helper: Convert lỗi Groq thành message thân thiện
const getErrorMessage = (error) => {
  const msg = error.message || '';
  if (msg.includes('chưa được cấu hình')) return msg;
  if (msg.includes('401') || msg.includes('invalid_api_key') || msg.includes('Authentication'))
    return 'Groq API key không hợp lệ. Kiểm tra GROQ_API_KEY trong .env';
  if (msg.includes('429') || msg.includes('rate_limit'))
    return 'Gửi quá nhanh! Chờ vài giây rồi thử lại';
  if (msg.includes('ECONNREFUSED') || msg.includes('ETIMEDOUT'))
    return 'Không kết nối được Groq. Kiểm tra mạng server';
  return `Lỗi AI: ${msg}`;
};

// @desc AI Chatbot assistant
// @route POST /api/ai/chat
const chatAssistant = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { message, history = [] } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Thiếu message' });
    }

    const context = await getUserContext(userId);

    // Build conversation với Groq (hỗ trợ multi-turn)
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'gsk_your_key_here') {
      throw new Error('GROQ_API_KEY chưa được cấu hình trong .env');
    }

    const messages = [
      {
        role: 'system',
        content: `Bạn là TaskFlow AI Assistant - trợ lý quản lý công việc thông minh.
Trả lời bằng tiếng Việt, ngắn gọn và hữu ích.
Thông tin công việc hiện tại của người dùng: ${JSON.stringify(context)}
Bạn có thể giúp: tạo task, lên kế hoạch, phân tích công việc, đưa ra lời khuyên năng suất.`
      },
      ...history.slice(-6).filter(m => m.role && m.content),
      { role: 'user', content: message }
    ];

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages,
      max_tokens: 600,
      temperature: 0.7
    });

    const reply = completion.choices[0].message.content;
    res.json({ success: true, reply: reply.trim() });
  } catch (error) {
    console.error('AI chat error:', error.message);
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

// @desc AI Suggest priority tasks
// @route POST /api/ai/suggest-priority
const suggestPriority = async (req, res) => {
  try {
    const userId = getUserId(req);
    const context = await getUserContext(userId);
    const tasks = await Task.find({ user: userId, status: 'pending' }).sort('deadline');

    if (tasks.length === 0) {
      return res.json({ success: true, suggestions: [], message: 'Không có task nào cần ưu tiên' });
    }

    const taskList = tasks.map((t, i) =>
      `${i + 1}. "${t.title}" - Priority: ${t.priority}, Deadline: ${t.deadline ? t.deadline.toLocaleDateString('vi-VN') : 'Chưa đặt'}, Status: ${t.status}`
    ).join('\n');

    const result = await callGroqJSON(
      `Bạn là trợ lý quản lý công việc. Phân tích task và trả về JSON hợp lệ.
QUAN TRỌNG: Chỉ trả về JSON, không có text khác, không markdown.
Format: { "suggestions": [{ "taskIndex": number, "title": string, "reason": string, "urgencyScore": number }], "summary": string }`,
      `Phân tích và gợi ý ưu tiên bằng tiếng Việt:\n${taskList}\nThống kê: ${JSON.stringify(context)}`
    );

    const suggestionsWithTasks = (result.suggestions || []).map(s => ({
      ...s,
      task: tasks[s.taskIndex - 1]
    }));

    res.json({ success: true, suggestions: suggestionsWithTasks, summary: result.summary });
  } catch (error) {
    console.error('AI suggest error:', error.message);
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

// @desc AI Auto schedule
// @route POST /api/ai/auto-schedule
const autoSchedule = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { date, workingHours } = req.body;
    const targetDate = new Date(date || new Date());

    const tasks = await Task.find({
      user: userId,
      status: { $in: ['pending', 'in-progress'] }
    }).sort('deadline');

    const taskList = tasks.map(t => ({
      id: t._id,
      title: t.title,
      priority: t.priority,
      estimatedDuration: t.estimatedDuration || 30,
      deadline: t.deadline
    }));

    const result = await callGroqJSON(
      `Bạn là AI scheduling assistant. Tạo lịch làm việc tối ưu.
QUAN TRỌNG: Chỉ trả về JSON, không có text khác, không markdown.
Format: { "schedule": [{ "taskId": string, "title": string, "startTime": string, "endTime": string, "reason": string }], "tips": string[] }`,
      `Tạo lịch bằng tiếng Việt cho ngày ${targetDate.toLocaleDateString('vi-VN')}.
Giờ làm: ${workingHours?.start || '08:00'} - ${workingHours?.end || '17:00'}.
Tasks: ${JSON.stringify(taskList)}`
    );

    res.json({ success: true, schedule: result.schedule || [], tips: result.tips || [] });
  } catch (error) {
    console.error('AI schedule error:', error.message);
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

// @desc AI Productivity analysis
// @route GET /api/ai/productivity-analysis
const productivityAnalysis = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const tasks = await Task.find({ user: userId, createdAt: { $gte: startDate } });

    const stats = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      pending: tasks.filter(t => t.status === 'pending').length,
      overdue: tasks.filter(t => t.deadline && new Date() > t.deadline && t.status !== 'completed').length,
      byPriority: {
        high: tasks.filter(t => t.priority === 'high').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        low: tasks.filter(t => t.priority === 'low').length
      },
      completionRate: tasks.length > 0
        ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)
        : 0
    };

    const result = await callGroqJSON(
      `Bạn là chuyên gia phân tích năng suất làm việc.
QUAN TRỌNG: Chỉ trả về JSON, không có text khác, không markdown.
Format: { "analysis": string, "strengths": string[], "improvements": string[], "score": number, "recommendations": string[] }`,
      `Phân tích năng suất bằng tiếng Việt trong ${days} ngày qua:\n${JSON.stringify(stats)}`
    );

    res.json({ success: true, stats, analysis: result });
  } catch (error) {
    console.error('AI analysis error:', error.message);
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

// @desc AI Auto create task from text
// @route POST /api/ai/create-task
const aiCreateTask = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ success: false, message: 'Thiếu mô tả task' });
    }

    const taskData = await callGroqJSON(
      `Trích xuất thông tin task từ văn bản tiếng Việt.
QUAN TRỌNG: Chỉ trả về JSON, không có text khác, không markdown.
Format: { "title": string, "description": string, "priority": "low"|"medium"|"high", "category": string, "estimatedDuration": number, "tags": string[] }
estimatedDuration tính bằng phút.`,
      `Tạo task từ mô tả: "${text}"`
    );

    if (userId) taskData.user = userId;
    taskData.aiSuggested = true;

    const task = await Task.create(taskData);
    res.status(201).json({ success: true, message: 'Task created by AI', task });
  } catch (error) {
    console.error('AI create task error:', error.message);
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

// @desc AI Smart reminders
// @route GET /api/ai/smart-reminders
const smartReminders = async (req, res) => {
  try {
    const userId = getUserId(req);
    const tasks = await Task.find({ user: userId, status: 'pending' });
    const now = new Date();

    const upcomingTasks = tasks
      .filter(t => t.deadline)
      .map(t => ({
        id: t._id,
        title: t.title,
        priority: t.priority,
        deadline: t.deadline,
        hoursLeft: Math.round((new Date(t.deadline) - now) / (1000 * 60 * 60))
      }))
      .filter(t => t.hoursLeft > 0 && t.hoursLeft < 72)
      .sort((a, b) => a.hoursLeft - b.hoursLeft);

    if (upcomingTasks.length === 0) {
      return res.json({ success: true, reminders: [], upcomingTasks: [] });
    }

    const result = await callGroqJSON(
      `Tạo nhắc nhở thông minh cho task sắp đến hạn.
QUAN TRỌNG: Chỉ trả về JSON, không có text khác, không markdown.
Format: { "reminders": [{ "taskId": string, "title": string, "message": string, "urgency": "low"|"medium"|"high" }] }`,
      `Tạo nhắc nhở bằng tiếng Việt cho: ${JSON.stringify(upcomingTasks)}`
    );

    res.json({ success: true, reminders: result.reminders || [], upcomingTasks });
  } catch (error) {
    console.error('Smart reminders error:', error.message);
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

// @desc Test Groq connection
// @route GET /api/ai/test
const testGroq = async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'gsk_your_key_here') {
      return res.status(500).json({ success: false, message: 'GROQ_API_KEY chưa cấu hình trong .env' });
    }
    const reply = await callGroqText('Trả lời đúng 3 từ tiếng Việt.', 'Xác nhận kết nối thành công');
    res.json({ success: true, message: 'Groq kết nối OK! 🚀', reply, model: MODEL, keyPrefix: apiKey.slice(0, 8) + '...' });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

module.exports = {
  suggestPriority, autoSchedule, productivityAnalysis,
  chatAssistant, aiCreateTask, smartReminders, testGroq
};