const express = require('express');
const router = express.Router();
const projCtrl = require('../controllers/projectController');
const taskCtrl = require('../controllers/taskController');
const { authenticate, authorize } = require('../middleware/auth');

// --- Project Management Module ---

// List all projects (Filtered by tenant_id in controller)
router.get('/', authenticate, projCtrl.listProjects);

// Create a new project (Check subscription limits in controller)
router.post('/', authenticate, projCtrl.createProject);

// Get single project details
router.get('/:projectId', authenticate, projCtrl.getProjectById);

// Update project (Required for API 14)
router.put('/:projectId', authenticate, projCtrl.updateProject);

// Delete project (Required for API 15)
router.delete('/:projectId', authenticate, projCtrl.deleteProject);


// --- Task Management Module ---

// List tasks for a specific project
router.get('/:projectId/tasks', authenticate, taskCtrl.getProjectTasks);

// Create task within a project
router.post('/:projectId/tasks', authenticate, taskCtrl.createTask);

// Quick Kanban status update
router.patch('/tasks/:taskId/status', authenticate, taskCtrl.updateTaskStatus);

// Full task update (Required for API 19)
router.put('/tasks/:taskId', authenticate, taskCtrl.updateTask);

// Delete task
router.delete('/tasks/:taskId', authenticate, taskCtrl.deleteTask);

module.exports = router;