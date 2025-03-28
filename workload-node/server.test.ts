import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from './server';
import * as Sentry from '@sentry/node';

// Mock Sentry
vi.mock('@sentry/node', () => ({
  Handlers: {
    requestHandler: vi.fn(() => (req: any, res: any, next: any) => next()),
    errorHandler: vi.fn(() => (err: any, req: any, res: any, next: any) => next(err)),
  },
  captureException: vi.fn(),
}));

describe('Server', () => {
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
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await request(app)
        .get('/api/non-existent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).not.toHaveProperty('stack');

      process.env.NODE_ENV = originalEnv;
    });

    it('should include stack trace in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const response = await request(app)
        .get('/api/non-existent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('stack');

      process.env.NODE_ENV = originalEnv;
    });

    it('should use Sentry error handler', async () => {
      const error = new Error('Test error');
      const response = await request(app)
        .get('/error');

      expect(Sentry.captureException).toHaveBeenCalled();
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