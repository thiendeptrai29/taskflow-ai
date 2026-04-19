const OpenAI = require('openai');
const Task = require('../models/Task');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper: Get user context
const getUserContext = async (userId) => {
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
      title: t.title,
      status: t.status,
      priority: t.priority,
      deadline: t.deadline,
      category: t.category
    }))
  };
};

// @desc AI Suggest priority tasks
// @route POST /api/ai/suggest-priority
const suggestPriority = async (req, res) => {
  try {
    const context = await getUserContext(req.user._id);
    const tasks = await Task.find({ user: req.user._id, status: 'pending' }).sort('deadline');

    if (tasks.length === 0) {
      return res.json({ success: true, suggestions: [], message: 'Không có task nào cần ưu tiên' });
    }

    const taskList = tasks.map((t, i) => 
      `${i+1}. "${t.title}" - Priority: ${t.priority}, Deadline: ${t.deadline ? t.deadline.toLocaleDateString('vi-VN') : 'Chưa đặt'}, Status: ${t.status}`
    ).join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Bạn là trợ lý quản lý công việc thông minh. Phân tích danh sách task và đưa ra gợi ý ưu tiên bằng tiếng Việt. 
          Trả về JSON với format: { "suggestions": [{ "taskIndex": number, "title": string, "reason": string, "urgencyScore": number }], "summary": string }`
        },
        {
          role: 'user',
          content: `Phân tích và gợi ý thứ tự ưu tiên cho các task sau:\n${taskList}\n\nThống kê: ${JSON.stringify(context)}`
        }
      ],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    
    // Map back to task IDs
    const suggestionsWithTasks = result.suggestions?.map(s => ({
      ...s,
      task: tasks[s.taskIndex - 1]
    })) || [];

    res.json({ success: true, suggestions: suggestionsWithTasks, summary: result.summary });
  } catch (error) {
    console.error('AI suggest error:', error);
    res.status(500).json({ success: false, message: 'AI service unavailable', error: error.message });
  }
};

// @desc AI Auto schedule
// @route POST /api/ai/auto-schedule
const autoSchedule = async (req, res) => {
  try {
    const { date, workingHours } = req.body;
    const targetDate = new Date(date || new Date());
    const tasks = await Task.find({ 
      user: req.user._id, 
      status: { $in: ['pending', 'in-progress'] }
    }).sort('deadline');

    const taskList = tasks.map(t => ({
      id: t._id,
      title: t.title,
      priority: t.priority,
      estimatedDuration: t.estimatedDuration || 30,
      deadline: t.deadline
    }));

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Bạn là AI scheduling assistant. Tạo lịch làm việc tối ưu bằng tiếng Việt.
          Trả về JSON: { "schedule": [{ "taskId": string, "title": string, "startTime": string, "endTime": string, "reason": string }], "tips": string[] }`
        },
        {
          role: 'user',
          content: `Tạo lịch làm việc cho ngày ${targetDate.toLocaleDateString('vi-VN')}.
          Giờ làm việc: ${workingHours?.start || '08:00'} - ${workingHours?.end || '17:00'}.
          Tasks cần sắp xếp: ${JSON.stringify(taskList)}`
        }
      ],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    res.json({ success: true, schedule: result.schedule || [], tips: result.tips || [] });
  } catch (error) {
    console.error('AI schedule error:', error);
    res.status(500).json({ success: false, message: 'AI service unavailable', error: error.message });
  }
};

// @desc AI Productivity analysis
// @route GET /api/ai/productivity-analysis
const productivityAnalysis = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const tasks = await Task.find({ user: req.user._id, createdAt: { $gte: startDate } });
    
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
      completionRate: tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0
    };

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Bạn là chuyên gia phân tích năng suất. Phân tích dữ liệu công việc và đưa ra nhận xét, lời khuyên bằng tiếng Việt.
          Trả về JSON: { "analysis": string, "strengths": string[], "improvements": string[], "score": number, "recommendations": string[] }`
        },
        {
          role: 'user',
          content: `Phân tích năng suất làm việc trong ${days} ngày qua:\n${JSON.stringify(stats)}`
        }
      ],
      response_format: { type: 'json_object' }
    });

    const aiResult = JSON.parse(completion.choices[0].message.content);
    res.json({ success: true, stats, analysis: aiResult });
  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({ success: false, message: 'AI service unavailable', error: error.message });
  }
};

// @desc AI Chatbot assistant
// @route POST /api/ai/chat
const chatAssistant = async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    const context = await getUserContext(req.user._id);

    const messages = [
      {
        role: 'system',
        content: `Bạn là TaskFlow AI Assistant - trợ lý quản lý công việc thông minh. 
        Trả lời bằng tiếng Việt, ngắn gọn và hữu ích.
        Thông tin người dùng hiện tại: ${JSON.stringify(context)}
        Bạn có thể giúp: tạo task, lên kế hoạch, phân tích công việc, đưa ra lời khuyên năng suất.`
      },
      ...history.slice(-6),
      { role: 'user', content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: 500
    });

    const reply = completion.choices[0].message.content;
    res.json({ success: true, reply });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ success: false, message: 'AI service unavailable', error: error.message });
  }
};

// @desc AI Auto create task from text
// @route POST /api/ai/create-task
const aiCreateTask = async (req, res) => {
  try {
    const { text } = req.body;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Trích xuất thông tin task từ văn bản và trả về JSON với format:
          { "title": string, "description": string, "priority": "low"|"medium"|"high", "category": string, "estimatedDuration": number (minutes), "tags": string[] }
          Không bao gồm deadline nếu không được đề cập rõ ràng.`
        },
        { role: 'user', content: `Tạo task từ mô tả: "${text}"` }
      ],
      response_format: { type: 'json_object' }
    });

    const taskData = JSON.parse(completion.choices[0].message.content);
    taskData.user = req.user._id;
    taskData.aiSuggested = true;

    const task = await Task.create(taskData);
    res.status(201).json({ success: true, message: 'Task created by AI', task });
  } catch (error) {
    console.error('AI create task error:', error);
    res.status(500).json({ success: false, message: 'AI service unavailable', error: error.message });
  }
};

// @desc AI Smart reminder analysis
// @route GET /api/ai/smart-reminders
const smartReminders = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id, status: 'pending' });
    const now = new Date();
    
    const upcomingTasks = tasks.filter(t => t.deadline).map(t => ({
      id: t._id,
      title: t.title,
      priority: t.priority,
      deadline: t.deadline,
      hoursLeft: Math.round((t.deadline - now) / (1000 * 60 * 60))
    })).filter(t => t.hoursLeft > 0 && t.hoursLeft < 72).sort((a, b) => a.hoursLeft - b.hoursLeft);

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Tạo nhắc nhở thông minh cho các task sắp đến hạn. Trả về JSON:
          { "reminders": [{ "taskId": string, "title": string, "message": string, "urgency": "low"|"medium"|"high" }] }`
        },
        {
          role: 'user',
          content: `Tạo nhắc nhở cho các task này: ${JSON.stringify(upcomingTasks)}`
        }
      ],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    res.json({ success: true, reminders: result.reminders || [], upcomingTasks });
  } catch (error) {
    console.error('Smart reminders error:', error);
    res.status(500).json({ success: false, message: 'AI service unavailable', error: error.message });
  }
};

module.exports = { suggestPriority, autoSchedule, productivityAnalysis, chatAssistant, aiCreateTask, smartReminders };
