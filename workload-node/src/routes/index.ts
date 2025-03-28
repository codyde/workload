import express from 'express';
import * as Sentry from '@sentry/node';

// Import controllers
import { projectRoutes } from './projectRoutes';
import { epicRoutes } from './epicRoutes';
import { taskRoutes } from './taskRoutes';

// Define a generic type for the controller function
type ControllerFunction = (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<any>;

// Helper function to wrap controller methods with Sentry spans with proper typing
export const withSentrySpan = (
  name: string, 
  operation: string, 
  controllerFn: ControllerFunction
) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      return Sentry.startSpan(
        {
          name,
          op: operation,
        },
        async () => {
          // Execute the controller function
          return await controllerFn(req, res, next);
        }
      );
    } catch (error) {
      next(error);
    }
  };
};

export const createRoutes = () => {
  const router = express.Router();
  
  // Use routes
  router.use('/projects', projectRoutes);
  router.use('/epics', epicRoutes);
  router.use('/tasks', taskRoutes);
  
  return router;
};