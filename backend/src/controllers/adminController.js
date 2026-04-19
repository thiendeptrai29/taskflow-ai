const User = require('../models/User');
const Task = require('../models/Task');

// @desc Get all users (admin)
// @route GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const { search, isActive } = req.query;
    const filter = {};
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const users = await User.find(filter).select('-password').sort('-createdAt');
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Toggle user active status
// @route PATCH /api/admin/users/:id/toggle
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot disable admin' });

    user.isActive = !user.isActive;
    await user.save();

    res.json({ success: true, message: `Account ${user.isActive ? 'enabled' : 'disabled'}`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Admin dashboard stats
// @route GET /api/admin/stats
const getAdminStats = async (req, res) => {
  try {
    const [totalUsers, activeUsers, totalTasks, completedTasks] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Task.countDocuments(),
      Task.countDocuments({ status: 'completed' })
    ]);

    // New users last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    res.json({
      success: true,
      stats: { totalUsers, activeUsers, totalTasks, completedTasks, newUsers, disabledUsers: totalUsers - activeUsers }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getUsers, toggleUserStatus, getAdminStats };
