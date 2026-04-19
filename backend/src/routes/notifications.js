const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getNotifications, markAsRead, deleteNotification } = require('../controllers/notificationController');

router.use(protect);
router.get('/', getNotifications);
router.patch('/mark-read', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
