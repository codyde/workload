import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from './server';

describe('Server', () => {
  describe('Basic Server Setup', () => {
    it('should have CORS configured', async () => {
      const response = await app.handle(
        new Request('http://localhost:3000/api', {
          method: 'OPTIONS',
          headers: {
            'Origin': 'http://localhost:5173'
          }
        })
      );
      
      expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:5173');
      expect(response.headers.get('access-control-allow-methods')).toContain('GET');
      expect(response.headers.get('access-control-allow-methods')).toContain('POST');
    });

    it('should handle JSON parsing', async () => {
      const response = await app.handle(
        new Request('http://localhost:3000/api/some-endpoint', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ test: 'data' })
        })
      );
      
      // Even if the endpoint doesn't exist, we should not get a parsing error
      expect(response.status).not.toBe(400);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors appropriately', async () => {
      const response = await app.handle(
        new Request('http://localhost:3000/api/non-existent')
      );

      expect(response.status).toBe(404);
    });
  });

  describe('API Documentation', () => {
    it('should serve Swagger documentation', async () => {
      const response = await app.handle(
        new Request('http://localhost:3000/swagger')
      );
      expect(response.status).toBe(200);
    });
  });
}); 