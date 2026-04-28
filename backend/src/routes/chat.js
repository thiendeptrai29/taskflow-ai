const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getSessions, getSession, createSession,
  saveMessages, renameSession, deleteSession
} = require('../controllers/chatController');

router.use(protect);

router.get('/sessions', getSessions);
router.post('/sessions', createSession);
router.get('/sessions/:sessionId', getSession);
router.post('/sessions/:sessionId/messages', saveMessages);
router.put('/sessions/:sessionId', renameSession);
router.delete('/sessions/:sessionId', deleteSession);

module.exports = router;