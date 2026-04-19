const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getUserStats } = require('../controllers/statsController');

router.use(protect);
router.get('/', getUserStats);

module.exports = router;
