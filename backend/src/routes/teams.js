const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getTeams, createTeam, getTeam, updateTeam, deleteTeam,
  inviteMember, cancelInvite, acceptInvite, declineInvite,
  getMyInvites, updateMemberRole, removeMember,
  getTeamTasks, createTeamTask
} = require('../controllers/teamController');

router.use(protect);

// Teams CRUD
router.get('/', getTeams);
router.post('/', createTeam);
router.get('/:id', getTeam);
router.patch('/:id', updateTeam);
router.delete('/:id', deleteTeam);

// ✅ Lời mời của tôi (pending)
router.get('/me/invites', getMyInvites);

// Members & Invites
router.post('/:id/invite', inviteMember);
router.delete('/:id/invites/:inviteId', cancelInvite);
router.post('/:id/invites/:inviteId/accept', acceptInvite);   // ✅ Chấp nhận
router.post('/:id/invites/:inviteId/decline', declineInvite); // ✅ Từ chối
router.patch('/:id/members/:memberId/role', updateMemberRole);
router.delete('/:id/members/:memberId', removeMember);

// Tasks
router.get('/:id/tasks', getTeamTasks);
router.post('/:id/tasks', createTeamTask);

module.exports = router;