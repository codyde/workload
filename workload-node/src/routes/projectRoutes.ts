import express from 'express';
import { withSentrySpan } from '.';
import { projectController } from '../controllers/projectController';

const router = express.Router();

// Get all projects
router.get('/', withSentrySpan('getAllProjects', 'http.server', async (req, res) => {
  const projects = await projectController.getAllProjects();
  return res.json(projects);
}));

// Get project by ID
router.get('/:id', withSentrySpan('getProjectById', 'http.server', async (req, res) => {
  const project = await projectController.getProjectById(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  return res.json(project);
}));

// Create project
router.post('/', withSentrySpan('createProject', 'http.server', async (req, res) => {
  const project = await projectController.createProject(req.body);
  return res.status(201).json(project);
}));

// Update project
router.put('/:id', withSentrySpan('updateProject', 'http.server', async (req, res) => {
  const project = await projectController.updateProject(req.params.id, req.body);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  return res.json(project);
}));

// Delete project
router.delete('/:id', withSentrySpan('deleteProject', 'http.server', async (req, res) => {
  const result = await projectController.deleteProject(req.params.id);
  return res.json(result);
}));

// Get epics by project ID
router.get('/:id/epics', withSentrySpan('getEpicsByProjectId', 'http.server', async (req, res) => {
  const epics = await projectController.getEpicsByProjectId(req.params.id);
  return res.json(epics);
}));

export { router as projectRoutes };
