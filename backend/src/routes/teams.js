const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const {
  getTeams,
  createTeam,
  getTeam,
  updateTeam,
  deleteTeam,
  inviteMember,
  cancelInvite,
  acceptInvite,
  declineInvite,
  getMyInvites,
  updateMemberRole,
  removeMember,
  getTeamTasks,
  createTeamTask,
  updateTeamTask,
  deleteTeamTask,
  getTeamActivities
} = require('../controllers/teamController');

router.use(protect);

router.get('/me/invites', getMyInvites);

router.get('/', getTeams);
router.post('/', createTeam);

router.post('/:id/invite', inviteMember);
router.delete('/:id/invites/:inviteId', cancelInvite);
router.post('/:id/invites/:inviteId/accept', acceptInvite);
router.post('/:id/invites/:inviteId/decline', declineInvite);

router.patch('/:id/members/:memberId/role', updateMemberRole);
router.delete('/:id/members/:memberId', removeMember);

router.get('/:id/tasks', getTeamTasks);
router.post('/:id/tasks', createTeamTask);
router.patch('/:id/tasks/:taskId', updateTeamTask);
router.delete('/:id/tasks/:taskId', deleteTeamTask);
router.get('/:id/activities', getTeamActivities);

router.get('/:id', getTeam);
router.patch('/:id', updateTeam);
router.delete('/:id', deleteTeam);

module.exports = router;
