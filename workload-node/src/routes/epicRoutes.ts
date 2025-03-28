import express from 'express';
import { withSentrySpan } from '.';
import { epicController } from '../controllers/epicController';

const router = express.Router();

// Get epic by ID
router.get('/:id', withSentrySpan('getEpicById', 'http.server', async (req, res) => {
  const epic = await epicController.getEpicById(req.params.id);
  if (!epic) {
    return res.status(404).json({ error: 'Epic not found' });
  }
  return res.json(epic);
}));

// Create epic
router.post('/', withSentrySpan('createEpic', 'http.server', async (req, res) => {
  const epic = await epicController.createEpic(req.body);
  return res.status(201).json(epic);
}));

// Update epic
router.put('/:id', withSentrySpan('updateEpic', 'http.server', async (req, res) => {
  const epic = await epicController.updateEpic(req.params.id, req.body);
  if (!epic) {
    return res.status(404).json({ error: 'Epic not found' });
  }
  return res.json(epic);
}));

// Delete epic
router.delete('/:id', withSentrySpan('deleteEpic', 'http.server', async (req, res) => {
  const result = await epicController.deleteEpic(req.params.id);
  return res.json(result);
}));

// Get tasks by epic ID
router.get('/:id/tasks', withSentrySpan('getTasksByEpicId', 'http.server', async (req, res) => {
  const tasks = await epicController.getTasksByEpicId(req.params.id);
  return res.json(tasks);
}));

export { router as epicRoutes };
