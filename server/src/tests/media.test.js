import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

describe('Media Routes and Upload Authorization', () => {
  const app = createApp();

  describe('POST /api/media/imagekit-auth', () => {
    it('rejects unauthenticated requests with 401 status', async () => {
      const res = await request(app)
        .post('/api/media/imagekit-auth')
        .send();

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.message).toMatch(/authentication required/i);
    });

    it('rejects requests with malformed authorization header with 401 status', async () => {
      const res = await request(app)
        .post('/api/media/imagekit-auth')
        .set('Authorization', 'Basic invalid-token')
        .send();

      expect(res.status).toBe(401);
      expect(res.body.error.message).toMatch(/authentication required/i);
    });
  });

  describe('DELETE /api/media/:fileId', () => {
    it('rejects unauthenticated deletion requests with 401 status', async () => {
      const res = await request(app)
        .delete('/api/media/sample_file_123')
        .send();

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.message).toMatch(/authentication required/i);
    });
  });
});

