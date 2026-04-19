const Task = require('../models/Task');
const Notification = require('../models/Notification');

// @desc Get all tasks
// @route GET /api/tasks
const getTasks = async (req, res) => {
  try {
    const { status, priority, search, startDate, endDate, sort = '-createdAt' } = req.query;
    
    const filter = { user: req.user._id };
    if (status && status !== 'all') filter.status = status;
    if (priority && priority !== 'all') filter.priority = priority;
    if (search) filter.title = { $regex: search, $options: 'i' };
    if (startDate || endDate) {
      filter.deadline = {};
      if (startDate) filter.deadline.$gte = new Date(startDate);
      if (endDate) filter.deadline.$lte = new Date(endDate);
    }

    const tasks = await Task.find(filter).sort(sort);

    res.json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get single task
// @route GET /api/tasks/:id
const getTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Create task
// @route POST /api/tasks
const createTask = async (req, res) => {
  try {
    const taskData = { ...req.body, user: req.user._id };
    
    if (req.files && req.files.length > 0) {
      taskData.attachments = req.files.map(file => ({
        filename: file.originalname,
        path: `/uploads/${file.filename}`,
        mimetype: file.mimetype,
        size: file.size
      }));
    }

    const task = await Task.create(taskData);

    // Schedule notification if deadline exists
    if (task.deadline) {
      await Notification.create({
        user: req.user._id,
        task: task._id,
        title: '⏰ Nhắc nhở deadline',
        message: `Task "${task.title}" sắp đến hạn vào ${new Date(task.deadline).toLocaleString('vi-VN')}`,
        type: 'deadline',
        scheduledFor: new Date(task.deadline - 24 * 60 * 60 * 1000) // 1 day before
      });
    }

    res.status(201).json({ success: true, message: 'Task created successfully', task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update task
// @route PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    let task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // If marking as completed, set completedAt
    if (req.body.status === 'completed' && task.status !== 'completed') {
      req.body.completedAt = new Date();
    }

    task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    res.json({ success: true, message: 'Task updated successfully', task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Delete task
// @route DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    await task.deleteOne();
    // Remove related notifications
    await Notification.deleteMany({ task: req.params.id });

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Toggle task completion
// @route PATCH /api/tasks/:id/toggle
const toggleTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (task.status === 'completed') {
      task.status = 'pending';
      task.completedAt = null;
    } else {
      task.status = 'completed';
      task.completedAt = new Date();
    }

    await task.save();
    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get tasks by calendar (grouped by date)
// @route GET /api/tasks/calendar
const getCalendarTasks = async (req, res) => {
  try {
    const { year, month } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const tasks = await Task.find({
      user: req.user._id,
      deadline: { $gte: startDate, $lte: endDate }
    }).sort('deadline');

    // Group by date
    const grouped = {};
    tasks.forEach(task => {
      const dateKey = task.deadline.toISOString().split('T')[0];
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(task);
    });

    res.json({ success: true, tasks, grouped });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update subtask
// @route PATCH /api/tasks/:id/subtasks/:subtaskId
const updateSubtask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) return res.status(404).json({ success: false, message: 'Subtask not found' });

    Object.assign(subtask, req.body);
    await task.save();

    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask, toggleTask, getCalendarTasks, updateSubtask };
