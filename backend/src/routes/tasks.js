const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');
const { getTasks, getTask, createTask, updateTask, deleteTask, toggleTask, getCalendarTasks, updateSubtask } = require('../controllers/taskController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `task-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.use(protect);

router.route('/')
  .get(getTasks)
  .post(upload.array('attachments', 5), createTask);

router.get('/calendar', getCalendarTasks);

router.route('/:id')
  .get(getTask)
  .put(updateTask)
  .delete(deleteTask);

router.patch('/:id/toggle', toggleTask);
router.patch('/:id/subtasks/:subtaskId', updateSubtask);

module.exports = router;
