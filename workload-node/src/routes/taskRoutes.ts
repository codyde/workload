import express from 'express';
import { withSentrySpan } from '.';
import { taskController } from '../controllers/taskController';

const router = express.Router();

// Get task by ID
router.get('/:id', withSentrySpan('getTaskById', 'http.server', async (req, res) => {
  const task = await taskController.getTaskById(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  return res.json(task);
}));

// Create task
router.post('/', withSentrySpan('createTask', 'http.server', async (req, res) => {
  const task = await taskController.createTask(req.body);
  return res.status(201).json(task);
}));

// Update task
router.put('/:id', withSentrySpan('updateTask', 'http.server', async (req, res) => {
  const task = await taskController.updateTask(req.params.id, req.body);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  return res.json(task);
}));

// Delete task
router.delete('/:id', withSentrySpan('deleteTask', 'http.server', async (req, res) => {
  const result = await taskController.deleteTask(req.params.id);
  return res.json(result);
}));

// Get subtasks
router.get('/:id/subtasks', withSentrySpan('getSubtasks', 'http.server', async (req, res) => {
  const subtasks = await taskController.getSubtasks(req.params.id);
  return res.json(subtasks);
}));

// Add dependency
router.post('/:id/dependencies/:dependsOnTaskId', withSentrySpan('addDependency', 'http.server', async (req, res) => {
  const result = await taskController.addDependency(req.params.id, req.params.dependsOnTaskId);
  return res.json(result);
}));

// Remove dependency
router.delete('/:id/dependencies/:dependsOnTaskId', withSentrySpan('removeDependency', 'http.server', async (req, res) => {
  const result = await taskController.removeDependency(req.params.id, req.params.dependsOnTaskId);
  return res.json(result);
}));

export { router as taskRoutes };
