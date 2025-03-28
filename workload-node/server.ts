import './instrument';
import express from 'express';
import cors from 'cors';
import * as Sentry from '@sentry/node';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';

import { initializeDatabase } from './src/db';
import { createRoutes } from './src/routes';

// Load environment variables
dotenv.config();

// Initialize the app
const app = express();
const PORT = process.env.PORT || 3000;

// Sentry request handler must be the first middleware
app.use(Sentry.Handlers.requestHandler());

// Middlewares
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'sentry-trace', 'baggage'],
  exposedHeaders: ['Content-Length', 'Content-Type', 'sentry-trace', 'baggage'],
  credentials: true,
  maxAge: 86400,
}));

// Swagger documentation
const swaggerDocs = {
  openapi: '3.0.0',
  info: {
    title: 'Workload API',
    version: '1.0.0',
    description: 'API for managing projects, epics, and tasks',
  },
  servers: [
    {
      url: `/api`,
      description: 'Development server',
    },
  ],
  paths: {},
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Setup routes
app.use('/api', createRoutes());

// Sentry error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

// Generic error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  const errorResponse = {
    statusCode: 500,
    error: 'Internal Server Error',
    message: 'An error occurred',
  };
  
  if (err instanceof Error) {
    errorResponse.message = err.message;
    
    if (process.env.NODE_ENV !== 'production') {
      return res.status(500).json({
        ...errorResponse,
        stack: err.stack,
      });
    }
  }
  
  return res.status(500).json(errorResponse);
});

// Start the server
const startServer = async () => {
  try {
    // Initialize the database
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Workload API is running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();