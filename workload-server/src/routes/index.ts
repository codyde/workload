import { Elysia, type Context } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import * as Sentry from '@sentry/bun';
import { projectController } from '../controllers/projectController';
import { epicController } from '../controllers/epicController';
import { taskController } from '../controllers/taskController';

// Define a generic type for the controller function
type ControllerFunction<T> = (context: T) => Promise<any>;

// Helper function to wrap controller methods with Sentry spans with proper typing
const withSentrySpan = <T extends Context>(
  name: string, 
  operation: string, 
  controllerFn: ControllerFunction<T>
) => {
  return async (context: T) => {
    // Get sentry headers from the request
    const sentryTrace = context.request.headers.get('sentry-trace') as string | undefined;
    const baggage = context.request.headers.get('baggage') as string | undefined;
    
    return Sentry.continueTrace({ sentryTrace, baggage }, () => {
      return Sentry.startSpan(
        {
          name,
          op: operation,
        },
        async () => {
          // Execute the controller function
          return await controllerFn(context);
        }
      );
    });
  };
};

export const createRoutes = () => {
  const api = new Elysia()
    .use(
      swagger({
        documentation: {
          info: {
            title: 'Workload API',
            version: '1.0.0',
            description: 'API for managing projects, epics, and tasks',
          },
        },
      })
    )
    .group('/api', (app) => 
      app
        // Project routes
        .group('/projects', (projects) => 
          projects
            .get('/', withSentrySpan('getAllProjects', 'http.server', async () => 
              await projectController.getAllProjects()
            ))
            .get('/:id', withSentrySpan('getProjectById', 'http.server', async ({ params: { id } }) => 
              await projectController.getProjectById(id)
            ))
            .post('/', withSentrySpan('createProject', 'http.server', async ({ body }) => 
              await projectController.createProject(body as any)
            ))
            .put('/:id', withSentrySpan('updateProject', 'http.server', async ({ params: { id }, body }) => 
              await projectController.updateProject(id, body as any)
            ))
            .delete('/:id', withSentrySpan('deleteProject', 'http.server', async ({ params: { id } }) => 
              await projectController.deleteProject(id)
            ))
            .get('/:id/epics', withSentrySpan('getEpicsByProjectId', 'http.server', async ({ params: { id } }) => 
              await epicController.getEpicsByProjectId(id)
            ))
        )
        
        // Epic routes
        .group('/epics', (epics) => 
          epics
            .get('/:id', withSentrySpan('getEpicById', 'http.server', async ({ params: { id } }) => 
              await epicController.getEpicById(id)
            ))
            .post('/', withSentrySpan('createEpic', 'http.server', async ({ body }) => 
              await epicController.createEpic(body as any)
            ))
            .put('/:id', withSentrySpan('updateEpic', 'http.server', async ({ params: { id }, body }) => 
              await epicController.updateEpic(id, body as any)
            ))
            .delete('/:id', withSentrySpan('deleteEpic', 'http.server', async ({ params: { id } }) => 
              await epicController.deleteEpic(id)
            ))
            .get('/:id/tasks', withSentrySpan('getTasksByEpicId', 'http.server', async ({ params: { id } }) => 
              await taskController.getTasksByEpicId(id)
            ))
        )
        
        // Task routes
        .group('/tasks', (tasks) => 
          tasks
            .get('/:id', withSentrySpan('getTaskById', 'http.server', async ({ params: { id } }) => 
              await taskController.getTaskById(id)
            ))
            .post('/', withSentrySpan('createTask', 'http.server', async ({ body }) => 
              await taskController.createTask(body as any)
            ))
            .put('/:id', withSentrySpan('updateTask', 'http.server', async ({ params: { id }, body }) => 
              await taskController.updateTask(id, body as any)
            ))
            .delete('/:id', withSentrySpan('deleteTask', 'http.server', async ({ params: { id } }) => 
              await taskController.deleteTask(id)
            ))
            .get('/:id/subtasks', withSentrySpan('getSubtasks', 'http.server', async ({ params: { id } }) => 
              await taskController.getSubtasks(id)
            ))
            .post('/:id/dependencies/:dependsOnTaskId', withSentrySpan('addDependency', 'http.server', async ({ params: { id, dependsOnTaskId } }) => 
              await taskController.addDependency(id, dependsOnTaskId)
            ))
            .delete('/:id/dependencies/:dependsOnTaskId', withSentrySpan('removeDependency', 'http.server', async ({ params: { id, dependsOnTaskId } }) => 
              await taskController.removeDependency(id, dependsOnTaskId)
            ))
        )
    );

  return api;
};