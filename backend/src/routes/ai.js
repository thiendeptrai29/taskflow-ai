const express = require('express');
const router = express.Router();
const { suggestPriority, autoSchedule, productivityAnalysis, chatAssistant, aiCreateTask, smartReminders } = require('../controllers/aiController');

// TẠM THỜI COMMENT DÒNG NÀY ĐỂ TEST
// const { protect } = require('../middleware/auth');
// router.use(protect); 

router.post('/suggest-priority', suggestPriority);
// ... các dòng còn lại giữ nguyên

router.post('/suggest-priority', suggestPriority);
router.post('/auto-schedule', autoSchedule);
router.get('/productivity-analysis', productivityAnalysis);
router.post('/chat', chatAssistant);
router.post('/create-task', aiCreateTask);
router.get('/smart-reminders', smartReminders);

module.exports = router;
