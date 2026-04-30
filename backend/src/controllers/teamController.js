const Team = require('../models/Team');
const Task = require('../models/Task');
const User = require('../models/User');

// ✅ FIX: getMyRole xử lý cả 2 trường hợp: user là ObjectId hoặc populated object
const getMyRole = (team, userId) => {
  const uid = userId.toString();
  const member = team.members.find(m => {
    // Sau populate: m.user là object có _id
    // Chưa populate: m.user là ObjectId
    const memberId = m.user?._id ? m.user._id.toString() : m.user.toString();
    return memberId === uid;
  });
  return member ? member.role : null;
};

// Helper: format team để trả về frontend
const formatTeam = (team, userId) => {
  const myRole = getMyRole(team, userId);
  return {
    id: team._id,
    name: team.name,
    description: team.description,
    color: team.color,
    avatar: team.avatar,
    memberCount: team.members.length,
    myRole,
    createdAt: team.createdAt,
    createdBy: team.createdBy
  };
};

// ========================
// GET /api/teams
// ========================
exports.getTeams = async (req, res) => {
  try {
    const teams = await Team.find({
      'members.user': req.user._id
    }).populate('createdBy', 'name email');

    const teamsWithStats = await Promise.all(
      teams.map(async (team) => {
        const openTaskCount = await Task.countDocuments({
          team: team._id,
          status: { $in: ['pending', 'in-progress'] }
        });
        return {
          ...formatTeam(team, req.user._id),
          openTaskCount
        };
      })
    );

    res.json({ success: true, teams: teamsWithStats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ========================
// POST /api/teams
// ========================
exports.createTeam = async (req, res) => {
  try {
    const { name, description, color } = req.body;

    if (!name || name.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Tên team phải ít nhất 3 ký tự' });
    }

    const team = await Team.create({
      name: name.trim(),
      description: description?.trim(),
      color: color || '#06b6d4',
      createdBy: req.user._id,
      members: [{ user: req.user._id, role: 'owner' }]
    });

    res.status(201).json({
      success: true,
      team: {
        ...formatTeam(team, req.user._id),
        openTaskCount: 0
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi tạo team' });
  }
};

// ========================
// GET /api/teams/:id
// ========================
exports.getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('members.user', 'name email avatar role')
      .populate('invites.invitedBy', 'name');

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team không tồn tại' });
    }

    // ✅ FIX: dùng getMyRole đã được sửa, xử lý đúng sau populate
    const myRole = getMyRole(team, req.user._id);

    if (!myRole) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không thuộc team này'
      });
    }

    const [totalTasks, completedTasks, overdueTasks] = await Promise.all([
      Task.countDocuments({ team: team._id }),
      Task.countDocuments({ team: team._id, status: 'completed' }),
      Task.countDocuments({
        team: team._id,
        status: { $nin: ['completed', 'cancelled'] },
        deadline: { $lt: new Date() }
      })
    ]);

    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const members = team.members.map(m => ({
      id: m.user._id,
      name: m.user.name,
      email: m.user.email,
      avatar: m.user.avatar,
      role: m.role,
      status: 'active',
      joinedAt: m.joinedAt
    }));

    const invites = team.invites.map(inv => ({
      id: inv._id,
      email: inv.email,
      role: inv.role,
      createdAt: inv.createdAt
    }));

    res.json({
      success: true,
      team: {
        id: team._id,
        name: team.name,
        description: team.description,
        color: team.color,
        avatar: team.avatar,
        memberCount: team.members.length,
        openTaskCount: totalTasks - completedTasks,
        myRole,
        createdAt: team.createdAt,
        createdBy: team.createdBy,
        members,
        invites,
        stats: {
          totalMembers: team.members.length,
          totalTasks,
          completedTasks,
          overdueTasks,
          progress
        }
      }
    });
  } catch (error) {
    console.error('getTeam error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ========================
// PATCH /api/teams/:id
// ========================
exports.updateTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team không tồn tại' });

    const myRole = getMyRole(team, req.user._id);
    if (myRole !== 'owner') {
      return res.status(403).json({ success: false, message: 'Chỉ Owner mới được sửa team' });
    }

    const { name, description, color } = req.body;
    if (name && name.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Tên team phải ít nhất 3 ký tự' });
    }

    if (name) team.name = name.trim();
    if (description !== undefined) team.description = description?.trim();
    if (color) team.color = color;

    await team.save();

    res.json({
      success: true,
      team: { ...formatTeam(team, req.user._id), openTaskCount: 0 }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi cập nhật team' });
  }
};

// ========================
// DELETE /api/teams/:id
// ========================
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team không tồn tại' });

    const myRole = getMyRole(team, req.user._id);
    if (myRole !== 'owner') {
      return res.status(403).json({ success: false, message: 'Chỉ Owner mới được xóa team' });
    }

    await Team.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Đã xóa team' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi xóa team' });
  }
};

// ========================
// POST /api/teams/:id/invite
// ========================
exports.inviteMember = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team không tồn tại' });

    const myRole = getMyRole(team, req.user._id);
    if (!['owner', 'admin'].includes(myRole)) {
      return res.status(403).json({ success: false, message: 'Không có quyền mời thành viên' });
    }

    const { email, role = 'member' } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email là bắt buộc' });

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      const alreadyMember = team.members.some(m => {
        const memberId = m.user?._id ? m.user._id.toString() : m.user.toString();
        return memberId === existingUser._id.toString();
      });
      if (alreadyMember) {
        return res.status(400).json({ success: false, message: 'Người dùng đã là thành viên' });
      }
    }

    const alreadyInvited = team.invites.some(i => i.email === email.toLowerCase());
    if (alreadyInvited) {
      return res.status(400).json({ success: false, message: 'Đã gửi lời mời cho email này' });
    }

    // Nếu user tồn tại → thêm thẳng
    if (existingUser) {
      team.members.push({ user: existingUser._id, role });
      await team.save();
      return res.json({
        success: true,
        message: `Đã thêm ${existingUser.name} vào team`,
        invite: { id: Date.now().toString(), email, role, createdAt: new Date() }
      });
    }

    // Chưa có tài khoản → lưu invite pending
    team.invites.push({ email: email.toLowerCase(), role, invitedBy: req.user._id });
    await team.save();

    const savedInvite = team.invites[team.invites.length - 1];
    res.json({
      success: true,
      message: 'Đã gửi lời mời',
      invite: {
        id: savedInvite._id,
        email: savedInvite.email,
        role: savedInvite.role,
        createdAt: savedInvite.createdAt
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi gửi lời mời' });
  }
};

// ========================
// DELETE /api/teams/:id/invites/:inviteId
// ========================
exports.cancelInvite = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team không tồn tại' });

    const myRole = getMyRole(team, req.user._id);
    if (!['owner', 'admin'].includes(myRole)) {
      return res.status(403).json({ success: false, message: 'Không có quyền hủy lời mời' });
    }

    team.invites = team.invites.filter(i => i._id.toString() !== req.params.inviteId);
    await team.save();

    res.json({ success: true, message: 'Đã hủy lời mời' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi hủy lời mời' });
  }
};

// ========================
// PATCH /api/teams/:id/members/:memberId/role
// ========================
exports.updateMemberRole = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team không tồn tại' });

    const myRole = getMyRole(team, req.user._id);
    if (myRole !== 'owner') {
      return res.status(403).json({ success: false, message: 'Chỉ Owner mới được đổi vai trò' });
    }

    const { role } = req.body;
    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role không hợp lệ' });
    }

    const member = team.members.find(m => {
      const memberId = m.user?._id ? m.user._id.toString() : m.user.toString();
      return memberId === req.params.memberId;
    });
    if (!member) return res.status(404).json({ success: false, message: 'Thành viên không tồn tại' });
    if (member.role === 'owner') {
      return res.status(400).json({ success: false, message: 'Không thể đổi role của Owner' });
    }

    member.role = role;
    await team.save();

    res.json({ success: true, message: 'Đã cập nhật vai trò' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi cập nhật vai trò' });
  }
};

// ========================
// DELETE /api/teams/:id/members/:memberId
// ========================
exports.removeMember = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team không tồn tại' });

    const myRole = getMyRole(team, req.user._id);
    if (!['owner', 'admin'].includes(myRole)) {
      return res.status(403).json({ success: false, message: 'Không có quyền xóa thành viên' });
    }

    const targetMember = team.members.find(m => {
      const memberId = m.user?._id ? m.user._id.toString() : m.user.toString();
      return memberId === req.params.memberId;
    });
    if (!targetMember) return res.status(404).json({ success: false, message: 'Thành viên không tồn tại' });
    if (targetMember.role === 'owner') {
      return res.status(400).json({ success: false, message: 'Không thể xóa Owner' });
    }
    if (myRole === 'admin' && targetMember.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admin không thể xóa Admin khác' });
    }

    team.members = team.members.filter(m => {
      const memberId = m.user?._id ? m.user._id.toString() : m.user.toString();
      return memberId !== req.params.memberId;
    });
    await team.save();

    res.json({ success: true, message: 'Đã xóa thành viên' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi xóa thành viên' });
  }
};

// ========================
// GET /api/teams/:id/tasks
// ========================
exports.getTeamTasks = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team không tồn tại' });

    const myRole = getMyRole(team, req.user._id);
    if (!myRole) return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });

    const { status, priority, assignee } = req.query;
    const filter = { team: req.params.id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee;

    const tasks = await Task.find(filter)
      .populate('user', 'name email avatar')
      .populate('assignee', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi lấy tasks' });
  }
};

// ========================
// POST /api/teams/:id/tasks
// ========================
exports.createTeamTask = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team không tồn tại' });

    const myRole = getMyRole(team, req.user._id);
    if (!myRole) return res.status(403).json({ success: false, message: 'Không có quyền tạo task' });

    const { title, description, priority, deadline, assignee } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Tiêu đề task là bắt buộc' });

    const task = await Task.create({
      title, description,
      priority: priority || 'medium',
      deadline,
      user: req.user._id,
      team: req.params.id,
      assignee: assignee || null
    });

    await task.populate('user', 'name email avatar');
    await task.populate('assignee', 'name email avatar');

    res.status(201).json({ success: true, task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi tạo task' });
  }
};