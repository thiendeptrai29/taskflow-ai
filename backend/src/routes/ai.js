const express = require('express');
const router = express.Router();
const {
  suggestPriority, autoSchedule, productivityAnalysis,
  chatAssistant, aiCreateTask, smartReminders, testGroq
} = require('../controllers/aiController');

// const { protect } = require('../middleware/auth');
// router.use(protect);

router.get('/test', testGroq);
router.post('/chat', chatAssistant);
router.post('/suggest-priority', suggestPriority);
router.post('/auto-schedule', autoSchedule);
router.get('/productivity-analysis', productivityAnalysis);
router.post('/create-task', aiCreateTask);
router.get('/smart-reminders', smartReminders);

module.exports = router;