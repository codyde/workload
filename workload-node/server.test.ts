import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import type { Request, Response, NextFunction } from 'express';
import express from 'express';

// Mock modules before importing app
vi.mock('@sentry/node', () => {
  const captureException = vi.fn();
  return {
    init: vi.fn(),
    Handlers: {
      requestHandler: vi.fn(() => (req: any, res: any, next: any) => next()),
      errorHandler: vi.fn(() => (err: any, req: any, res: any, next: any) => {
        captureException(err);
        res.status(500).json({
          error: 'Internal Server Error',
          message: err.message,
          ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
        });
      })
    },
    captureException,
    captureMessage: vi.fn(),
    close: vi.fn(),
    flush: vi.fn(),
    startSpan: vi.fn((options: any, callback: Function) => callback()),
    getCurrentHub: vi.fn(() => ({
      getClient: () => ({
        getOptions: () => ({}),
      }),
    })),
  };
});

// Mock database initialization
vi.mock('./src/db', () => ({
  initializeDatabase: vi.fn().mockResolvedValue(undefined),
}));

// Mock the routes module with an error route
vi.mock('./src/routes/index', () => {
  return {
    createRoutes: vi.fn(() => {
      const router = express.Router();
      // Add a test route that throws an error
      router.get('/error-test', (_req: Request, _res: Response, next: NextFunction) => {
        const error = new Error('Test error');
        next(error);
      });
      return router;
    }),
    withSentrySpan: (name: string, operation: string, controllerFn: Function) => {
      return async (req: Request, res: Response, next: NextFunction) => {
        try {
          return await controllerFn(req, res, next);
        } catch (error) {
          next(error);
        }
      };
    },
  };
});

// Import app after mocks are set up
import { app } from './server';
import * as Sentry from '@sentry/node';

describe('Server', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    // Reset NODE_ENV
    process.env.NODE_ENV = 'test';
  });

  describe('Basic Server Setup', () => {
    it('should have CORS configured', async () => {
      const response = await request(app)
        .options('/')
        .set('Origin', 'http://localhost:5173');
      
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
      expect(response.headers['access-control-allow-methods']).toContain('POST');
    });

    it('should handle JSON parsing', async () => {
      const response = await request(app)
        .post('/api/test')
        .send({ test: 'data' });
      
      // Even if the endpoint doesn't exist, we should not get a parsing error
      expect(response.status).toBe(404); // Should be 404, not 400 (parsing error)
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in production mode', async () => {
      process.env.NODE_ENV = 'production';

      const response = await request(app)
        .get('/api/error-test');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Internal Server Error');
      expect(response.body).toHaveProperty('message', 'Test error');
      expect(response.body).not.toHaveProperty('stack');
    });

    it('should include stack trace in development mode', async () => {
      process.env.NODE_ENV = 'development';

      const response = await request(app)
        .get('/api/error-test');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Internal Server Error');
      expect(response.body).toHaveProperty('message', 'Test error');
      expect(response.body).toHaveProperty('stack');
    });

    it('should use Sentry error handler', async () => {
      const response = await request(app)
        .get('/api/error-test');

      expect(response.status).toBe(500);
      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error'
        })
      );
    });
  });

  describe('API Documentation', () => {
    it('should serve Swagger documentation', async () => {
      const response = await request(app).get('/api-docs/');
      expect(response.status).toBe(200);
      expect(response.text).toContain('swagger');
    });
  });
}); 