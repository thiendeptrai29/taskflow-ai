const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { getUsers, toggleUserStatus, getAdminStats } = require('../controllers/adminController');

router.use(protect, adminOnly);

router.get('/users', getUsers);
router.patch('/users/:id/toggle', toggleUserStatus);
router.get('/stats', getAdminStats);

module.exports = router;
