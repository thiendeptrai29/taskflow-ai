const Task = require('../models/Task');
const User = require('../models/User');

// @desc Get user stats dashboard
// @route GET /api/stats
const getUserStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [total, completed, pending, inProgress, overdue, thisWeekCompleted, highPriority] = await Promise.all([
      Task.countDocuments({ user: userId }),
      Task.countDocuments({ user: userId, status: 'completed' }),
      Task.countDocuments({ user: userId, status: 'pending' }),
      Task.countDocuments({ user: userId, status: 'in-progress' }),
      Task.countDocuments({ user: userId, status: { $ne: 'completed' }, deadline: { $lt: now } }),
      Task.countDocuments({ user: userId, status: 'completed', completedAt: { $gte: startOfWeek } }),
      Task.countDocuments({ user: userId, priority: 'high', status: { $ne: 'completed' } })
    ]);

    // Tasks per day for last 7 days
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);

      const [created, completedDay] = await Promise.all([
        Task.countDocuments({ user: userId, createdAt: { $gte: day, $lt: nextDay } }),
        Task.countDocuments({ user: userId, completedAt: { $gte: day, $lt: nextDay } })
      ]);

      dailyStats.push({
        date: day.toLocaleDateString('vi-VN', { weekday: 'short', month: 'numeric', day: 'numeric' }),
        created,
        completed: completedDay
      });
    }

    // Priority distribution
    const priorityStats = await Task.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    res.json({
      success: true,
      stats: {
        total, completed, pending, inProgress, overdue,
        thisWeekCompleted, highPriority, completionRate,
        dailyStats,
        priorityDistribution: priorityStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getUserStats };
