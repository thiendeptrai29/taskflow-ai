const Team = require('../models/Team');
const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');

const getMyRole = (team, userId) => {
  const uid = userId.toString();
  const member = team.members.find(m => {
    const memberId = m.user?._id ? m.user._id.toString() : m.user.toString();
    return memberId === uid;
  });
  return member ? member.role : null;
};

const canManageTasks = role => ['owner', 'admin'].includes(role);

const addActivity = (team, type, message, actor) => {
  if (!team.activities) team.activities = [];
  team.activities.push({ type, message, actor });

  if (team.activities.length > 100) {
    team.activities = team.activities.slice(-100);
  }
};

const isTeamMember = (team, userId) => {
  if (!userId) return false;

  return team.members.some(m => {
    const memberId = m.user?._id ? m.user._id.toString() : m.user.toString();
    return memberId === userId.toString();
  });
};

const formatTeam = (team, userId) => ({
  id: team._id,
  name: team.name,
  description: team.description,
  color: team.color,
  avatar: team.avatar,
  memberCount: team.members.length,
  myRole: getMyRole(team, userId),
  createdAt: team.createdAt,
  createdBy: team.createdBy
});

exports.getTeams = async (req, res) => {
  try {
    const teams = await Team.find({ 'members.user': req.user._id })
      .populate('createdBy', 'name email');

    const teamsWithStats = await Promise.all(teams.map(async team => {
      const openTaskCount = await Task.countDocuments({
        team: team._id,
        status: { $in: ['pending', 'in-progress'] }
      });

      return { ...formatTeam(team, req.user._id), openTaskCount };
    }));

    res.json({ success: true, teams: teamsWithStats });
  } catch (error) {
    console.error('getTeams error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

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

    addActivity(team, 'team_created', `${req.user.name} đã tạo team "${team.name}"`, req.user._id);
    await team.save();

    res.status(201).json({
      success: true,
      team: { ...formatTeam(team, req.user._id), openTaskCount: 0 }
    });
  } catch (error) {
    console.error('createTeam error:', error);
    res.status(500).json({ success: false, message: 'Lỗi tạo team' });
  }
};

exports.getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('members.user', 'name email avatar role')
      .populate('invites.invitedBy', 'name');

    if (!team) return res.status(404).json({ success: false, message: 'Team không tồn tại' });

    const myRole = getMyRole(team, req.user._id);
    if (!myRole) return res.status(403).json({ success: false, message: 'Bạn không thuộc team này' });

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
      status: inv.status || 'pending',
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

exports.updateTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) return res.status(404).json({ success: false, message: 'Team không tồn tại' });
    if (getMyRole(team, req.user._id) !== 'owner') {
      return res.status(403).json({ success: false, message: 'Chỉ Owner mới được sửa team' });
    }

    const { name, description, color } = req.body;

    if (name && name.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Tên team phải ít nhất 3 ký tự' });
    }

    if (name) team.name = name.trim();
    if (description !== undefined) team.description = description?.trim();
    if (color) team.color = color;

    addActivity(team, 'team_updated', `${req.user.name} đã cập nhật thông tin team`, req.user._id);
    await team.save();

    res.json({
      success: true,
      team: { ...formatTeam(team, req.user._id), openTaskCount: 0 }
    });
  } catch (error) {
    console.error('updateTeam error:', error);
    res.status(500).json({ success: false, message: 'Lỗi cập nhật team' });
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) return res.status(404).json({ success: false, message: 'Team không tồn tại' });
    if (getMyRole(team, req.user._id) !== 'owner') {
      return res.status(403).json({ success: false, message: 'Chỉ Owner mới được xóa team' });
    }

    await Team.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Đã xóa team' });
  } catch (error) {
    console.error('deleteTeam error:', error);
    res.status(500).json({ success: false, message: 'Lỗi xóa team' });
  }
};

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

    const normalizedEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser && isTeamMember(team, existingUser._id)) {
      return res.status(400).json({ success: false, message: 'Người dùng đã là thành viên' });
    }

    const alreadyInvited = team.invites.some(
      i => i.email === normalizedEmail && i.status === 'pending'
    );

    if (alreadyInvited) {
      return res.status(400).json({ success: false, message: 'Đã gửi lời mời cho email này' });
    }

    team.invites.push({
      email: normalizedEmail,
      role,
      invitedBy: req.user._id,
      status: 'pending'
    });

    addActivity(team, 'member_invited', `${req.user.name} đã mời ${normalizedEmail} vào team`, req.user._id);
    await team.save();

    const savedInvite = team.invites[team.invites.length - 1];

    if (existingUser) {
      await Notification.create({
        user: existingUser._id,
        title: '📩 Lời mời tham gia team',
        message: `Bạn được mời tham gia team "${team.name}" với vai trò ${role === 'admin' ? 'Admin' : 'Thành viên'}. Nhấn để xem chi tiết.`,
        type: 'system',
        metadata: {
          teamId: team._id,
          teamName: team.name,
          inviteId: savedInvite._id,
          role,
          invitedBy: req.user.name
        }
      });
    }

    res.json({
      success: true,
      message: existingUser
        ? `Đã gửi lời mời đến ${existingUser.name}. Họ cần chấp nhận để vào team.`
        : `Đã gửi lời mời đến ${email}`,
      invite: {
        id: savedInvite._id,
        email: savedInvite.email,
        role: savedInvite.role,
        status: 'pending',
        createdAt: savedInvite.createdAt
      }
    });
  } catch (error) {
    console.error('inviteMember error:', error);
    res.status(500).json({ success: false, message: 'Lỗi gửi lời mời' });
  }
};

exports.acceptInvite = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) return res.status(404).json({ success: false, message: 'Team không tồn tại' });

    const invite = team.invites.id(req.params.inviteId);
    if (!invite) return res.status(404).json({ success: false, message: 'Lời mời không tồn tại' });

    if (invite.email !== req.user.email.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'Lời mời này không dành cho bạn' });
    }

    if (invite.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Lời mời đã được ${invite.status === 'accepted' ? 'chấp nhận' : 'từ chối'}`
      });
    }

    team.members.push({ user: req.user._id, role: invite.role });
    invite.status = 'accepted';

    addActivity(team, 'member_joined', `${req.user.name} đã tham gia team`, req.user._id);
    await team.save();

    const owners = team.members.filter(m => ['owner', 'admin'].includes(m.role));

    await Promise.all(owners.map(m =>
      Notification.create({
        user: m.user?._id || m.user,
        title: '✅ Thành viên mới tham gia',
        message: `${req.user.name} đã chấp nhận lời mời và tham gia team "${team.name}"`,
        type: 'system'
      })
    ));

    res.json({ success: true, message: `Bạn đã tham gia team "${team.name}" thành công!` });
  } catch (error) {
    console.error('acceptInvite error:', error);
    res.status(500).json({ success: false, message: 'Lỗi chấp nhận lời mời' });
  }
};

exports.declineInvite = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) return res.status(404).json({ success: false, message: 'Team không tồn tại' });

    const invite = team.invites.id(req.params.inviteId);
    if (!invite) return res.status(404).json({ success: false, message: 'Lời mời không tồn tại' });

    if (invite.email !== req.user.email.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'Lời mời này không dành cho bạn' });
    }

    if (invite.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Lời mời này đã được xử lý' });
    }

    invite.status = 'declined';
    await team.save();

    res.json({ success: true, message: `Đã từ chối lời mời vào team "${team.name}"` });
  } catch (error) {
    console.error('declineInvite error:', error);
    res.status(500).json({ success: false, message: 'Lỗi từ chối lời mời' });
  }
};

exports.getMyInvites = async (req, res) => {
  try {
    const teams = await Team.find({
      'invites.email': req.user.email.toLowerCase(),
      'invites.status': 'pending'
    }).populate('createdBy', 'name email avatar');

    const invites = [];

    teams.forEach(team => {
      team.invites
        .filter(inv => inv.email === req.user.email.toLowerCase() && inv.status === 'pending')
        .forEach(inv => {
          invites.push({
            inviteId: inv._id,
            teamId: team._id,
            teamName: team.name,
            teamColor: team.color,
            teamAvatar: team.avatar,
            role: inv.role,
            invitedBy: team.createdBy,
            createdAt: inv.createdAt
          });
        });
    });

    res.json({ success: true, invites });
  } catch (error) {
    console.error('getMyInvites error:', error);
    res.status(500).json({ success: false, message: 'Lỗi lấy lời mời' });
  }
};

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
    console.error('cancelInvite error:', error);
    res.status(500).json({ success: false, message: 'Lỗi hủy lời mời' });
  }
};

exports.updateMemberRole = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) return res.status(404).json({ success: false, message: 'Team không tồn tại' });
    if (getMyRole(team, req.user._id) !== 'owner') {
      return res.status(403).json({ success: false, message: 'Chỉ Owner mới được đổi vai trò' });
    }

    const { role } = req.body;

    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role không hợp lệ' });
    }

    const member = team.members.find(m => {
      const mid = m.user?._id ? m.user._id.toString() : m.user.toString();
      return mid === req.params.memberId;
    });

    if (!member) return res.status(404).json({ success: false, message: 'Thành viên không tồn tại' });
    if (member.role === 'owner') return res.status(400).json({ success: false, message: 'Không thể đổi role của Owner' });

    member.role = role;

    addActivity(team, 'role_updated', `${req.user.name} đã đổi vai trò thành viên sang ${role}`, req.user._id);
    await team.save();

    res.json({ success: true, message: 'Đã cập nhật vai trò' });
  } catch (error) {
    console.error('updateMemberRole error:', error);
    res.status(500).json({ success: false, message: 'Lỗi cập nhật vai trò' });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) return res.status(404).json({ success: false, message: 'Team không tồn tại' });

    const myRole = getMyRole(team, req.user._id);

    if (!['owner', 'admin'].includes(myRole)) {
      return res.status(403).json({ success: false, message: 'Không có quyền xóa thành viên' });
    }

    const targetMember = team.members.find(m => {
      const mid = m.user?._id ? m.user._id.toString() : m.user.toString();
      return mid === req.params.memberId;
    });

    if (!targetMember) return res.status(404).json({ success: false, message: 'Thành viên không tồn tại' });
    if (targetMember.role === 'owner') return res.status(400).json({ success: false, message: 'Không thể xóa Owner' });
    if (myRole === 'admin' && targetMember.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admin không thể xóa Admin khác' });
    }

    team.members = team.members.filter(m => {
      const mid = m.user?._id ? m.user._id.toString() : m.user.toString();
      return mid !== req.params.memberId;
    });

    addActivity(team, 'member_removed', `${req.user.name} đã xóa một thành viên khỏi team`, req.user._id);
    await team.save();

    res.json({ success: true, message: 'Đã xóa thành viên' });
  } catch (error) {
    console.error('removeMember error:', error);
    res.status(500).json({ success: false, message: 'Lỗi xóa thành viên' });
  }
};

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
    console.error('getTeamTasks error:', error);
    res.status(500).json({ success: false, message: 'Lỗi lấy tasks' });
  }
};

exports.createTeamTask = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) return res.status(404).json({ success: false, message: 'Team không tồn tại' });

    const myRole = getMyRole(team, req.user._id);
    if (!canManageTasks(myRole)) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ Owner hoặc Admin mới được thêm task và giao nhiệm vụ'
      });
    }

    const { title, description, priority, deadline, assignee } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Tiêu đề task là bắt buộc' });
    }

    if (assignee && !isTeamMember(team, assignee)) {
      return res.status(400).json({ success: false, message: 'Người được giao không thuộc team này' });
    }

    const task = await Task.create({
      title: title.trim(),
      description,
      priority: priority || 'medium',
      deadline,
      user: req.user._id,
      team: req.params.id,
      assignee: assignee || null
    });

    await task.populate('user', 'name email avatar');
    await task.populate('assignee', 'name email avatar');

    addActivity(team, 'task_created', `${req.user.name} đã tạo task "${task.title}"`, req.user._id);
    await team.save();

    if (assignee && assignee.toString() !== req.user._id.toString()) {
  try {
    await Notification.create({
      user: assignee,
      title: '📌 Bạn được giao task mới',
      message: `${req.user.name} đã giao cho bạn task "${task.title}" trong team "${team.name}".`,
      type: 'system',
      metadata: {
        taskId: task._id,
        teamId: team._id,
        teamName: team.name,
        assignedBy: req.user.name
      }
    });
  } catch (notificationError) {
    console.error('createTeamTask notification error:', notificationError);
  }
}


    res.status(201).json({ success: true, task });
  } catch (error) {
    console.error('createTeamTask error:', error);
    res.status(500).json({ success: false, message: 'Lỗi tạo task' });
  }
};


exports.updateTeamTask = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) return res.status(404).json({ success: false, message: 'Team không tồn tại' });

    const myRole = getMyRole(team, req.user._id);
    if (!myRole) return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });

    const task = await Task.findOne({ _id: req.params.taskId, team: req.params.id });

    if (!task) return res.status(404).json({ success: false, message: 'Task không tồn tại' });

    const isManager = canManageTasks(myRole);
    const isAssignedMember = task.assignee && task.assignee.toString() === req.user._id.toString();
    const bodyKeys = Object.keys(req.body);
    const onlyStatusUpdate = bodyKeys.length === 1 && bodyKeys[0] === 'status';

    if (!isManager) {
      if (!isAssignedMember) {
        return res.status(403).json({
          success: false,
          message: 'Bạn chỉ được cập nhật tiến độ task được giao cho mình'
        });
      }

      if (!onlyStatusUpdate) {
        return res.status(403).json({
          success: false,
          message: 'Thành viên chỉ được cập nhật tiến độ task'
        });
      }
    }

    const { title, description, priority, deadline, assignee, status } = req.body;
    const allowedStatuses = ['pending', 'in-progress', 'completed', 'cancelled'];

    if (status !== undefined) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Trạng thái task không hợp lệ' });
      }

      task.status = status;
      task.completedAt = status === 'completed' ? new Date() : null;
    }

    if (isManager) {
      if (title !== undefined) {
        if (!title.trim()) {
          return res.status(400).json({ success: false, message: 'Tiêu đề task là bắt buộc' });
        }
        task.title = title.trim();
      }

      if (description !== undefined) task.description = description;
      if (priority !== undefined) task.priority = priority;
      if (deadline !== undefined) task.deadline = deadline || null;

      if (assignee !== undefined) {
        if (assignee && !isTeamMember(team, assignee)) {
          return res.status(400).json({ success: false, message: 'Người được giao không thuộc team này' });
        }

        task.assignee = assignee || null;
      }
    }

    await task.save();
    await task.populate('user', 'name email avatar');
    await task.populate('assignee', 'name email avatar');

    addActivity(
      team,
      isManager ? 'task_updated' : 'task_progress_updated',
      isManager
        ? `${req.user.name} đã cập nhật task "${task.title}"`
        : `${req.user.name} đã cập nhật tiến độ task "${task.title}"`,
      req.user._id
    );
    await team.save();

    res.json({ success: true, task });
  } catch (error) {
    console.error('updateTeamTask error:', error);
    res.status(500).json({ success: false, message: 'Lỗi cập nhật task' });
  }
};


exports.deleteTeamTask = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) return res.status(404).json({ success: false, message: 'Team không tồn tại' });

    const myRole = getMyRole(team, req.user._id);
    if (!canManageTasks(myRole)) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ Owner hoặc Admin mới được xóa task'
      });
    }

    const task = await Task.findOne({ _id: req.params.taskId, team: req.params.id });

    if (!task) return res.status(404).json({ success: false, message: 'Task không tồn tại' });

    const taskTitle = task.title;
    await Task.deleteOne({ _id: task._id });

    addActivity(team, 'task_deleted', `${req.user.name} đã xóa task "${taskTitle}"`, req.user._id);
    await team.save();

    res.json({ success: true, message: 'Đã xóa task' });
  } catch (error) {
    console.error('deleteTeamTask error:', error);
    res.status(500).json({ success: false, message: 'Lỗi xóa task' });
  }
};

exports.getTeamActivities = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('activities.actor', 'name email avatar');

    if (!team) return res.status(404).json({ success: false, message: 'Team không tồn tại' });

    if (!getMyRole(team, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
    }

    const activities = [...(team.activities || [])]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 50);

    res.json({ success: true, activities });
  } catch (error) {
    console.error('getTeamActivities error:', error);
    res.status(500).json({ success: false, message: 'Lỗi lấy hoạt động' });
  }
};
