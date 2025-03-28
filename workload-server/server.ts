// @ts-dignore
import "./instrument";

import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import * as Sentry from '@sentry/bun';
import { initializeDatabase } from './src/db';
import { createRoutes } from './src/routes';

// Initialize the database
await initializeDatabase();
 
// Create the API server
const app = new Elysia()
  .use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'sentry-trace', 'baggage'], // Add Sentry headers
    exposeHeaders: ['Content-Length', 'Content-Type', 'sentry-trace', 'baggage'], // Expose Sentry headers
    credentials: true,
    maxAge: 86400,
  }))
  // Add a middleware to handle Sentry tracing for all routes
  .onRequest((context) => {
    const sentryTrace = context.request.headers.get('sentry-trace') as string | undefined;
    const baggage = context.request.headers.get('baggage') as string | undefined;
    
    if (sentryTrace || baggage) {
      Sentry.continueTrace({ sentryTrace, baggage }, () => {
        // You don't need to start a span here as we'll handle that in the route handlers
      });
    }
  })
  .use(createRoutes())
  .onError(({ code, error }) => {
    console.error(`Error [${code}]:`, error);
    
    // Capture error in Sentry
    Sentry.captureException(error);
    
    // Default error response
    const errorResponse = {
      statusCode: code === 'NOT_FOUND' ? 404 : 500,
      error: code,
      message: 'An error occurred',
    };
    
    if (error instanceof Error) {
      errorResponse.message = error.message;
      
      if (process.env.NODE_ENV !== 'production') {
        return {
          ...errorResponse,
          stack: error.stack,
        };
      }
    }
    
    return errorResponse;
  })
  .listen(3000);

console.log(`🚀 Workload API is running at ${app.server?.hostname}:${app.server?.port}`);