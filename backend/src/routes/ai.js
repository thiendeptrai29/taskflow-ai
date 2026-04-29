const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  suggestPriority, autoSchedule, productivityAnalysis,
  chatAssistant, aiCreateTask, smartReminders, testGroq
} = require('../controllers/aiController');

// ✅ Route test KHÔNG cần auth (để debug dễ)
router.get('/test', testGroq);

// ✅ Tất cả routes còn lại CÓ auth
router.use(protect);

router.post('/chat', chatAssistant);
router.post('/suggest-priority', suggestPriority);
router.post('/auto-schedule', autoSchedule);
router.get('/productivity-analysis', productivityAnalysis);
router.post('/create-task', aiCreateTask);  // ✅ Cần auth để lấy userId
router.get('/smart-reminders', smartReminders);

module.exports = router;