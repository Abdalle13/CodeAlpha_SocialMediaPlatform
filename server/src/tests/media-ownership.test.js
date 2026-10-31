import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

let mockCurrentUser = { id: 'user-123', role: 'user' };
let mockProfileResult = { data: null, error: null };
let mockPostMediaResult = { data: [], error: null };
let mockDeleteFile = vi.fn().mockResolvedValue(true);

vi.mock('../middleware/auth.js', () => ({
  requireAuth: (req, res, next) => {
    req.user = mockCurrentUser;
    next();
  },
}));

vi.mock('../config/imagekit.js', () => ({
  isImageKitConfigured: () => true,
  getImageKit: () => ({
    deleteFile: mockDeleteFile,
    getAuthenticationParameters: () => ({
      token: 'mock-token',
      expire: 1234567890,
      signature: 'mock-sig',
    }),
  }),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve(mockProfileResult),
            }),
          }),
          update: () => ({
            eq: () => Promise.resolve({ data: {}, error: null }),
          }),
        };
      }
      if (table === 'post_media') {
        return {
          select: () => ({
            eq: () => Promise.resolve(mockPostMediaResult),
          }),
          delete: () => ({
            eq: () => Promise.resolve({ data: {}, error: null }),
          }),
        };
      }
      return {};
    },
  }),
}));

// Import after mocks
const { mediaRouter } = await import('../routes/media.js');

describe('Media Asset Deletion Ownership Rules', () => {
  let app;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api', mediaRouter);
  });

  it('rejects deletion with 403 when user does not own profile asset nor post media asset', async () => {
    mockCurrentUser = { id: 'attacker-id', role: 'user' };
    mockProfileResult = {
      data: { id: 'attacker-id', avatar_file_id: null, cover_file_id: null },
      error: null,
    };
    mockPostMediaResult = {
      data: [
        {
          id: 'pm-1',
          file_id: 'victim-file-id',
          posts: { author_id: 'victim-owner-id' },
        },
      ],
      error: null,
    };

    const res = await request(app).delete('/api/media/victim-file-id');

    expect(res.status).toBe(403);
    expect(res.body.error.message).toMatch(/permission to delete this asset/i);
    expect(mockDeleteFile).not.toHaveBeenCalled();
  });

  it('allows post author to delete an asset attached to their own post', async () => {
    mockCurrentUser = { id: 'author-id', role: 'user' };
    mockProfileResult = {
      data: { id: 'author-id', avatar_file_id: null, cover_file_id: null },
      error: null,
    };
    mockPostMediaResult = {
      data: [
        {
          id: 'pm-1',
          file_id: 'own-post-file-id',
          posts: { author_id: 'author-id' },
        },
      ],
      error: null,
    };

    const res = await request(app).delete('/api/media/own-post-file-id');

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/asset deleted successfully/i);
    expect(mockDeleteFile).toHaveBeenCalledWith('own-post-file-id');
  });

  it('allows user to delete their own avatar asset', async () => {
    mockCurrentUser = { id: 'user-id', role: 'user' };
    mockProfileResult = {
      data: { id: 'user-id', avatar_file_id: 'my-avatar-id', cover_file_id: null },
      error: null,
    };
    mockPostMediaResult = { data: [], error: null };

    const res = await request(app).delete('/api/media/my-avatar-id');

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/asset deleted successfully/i);
    expect(mockDeleteFile).toHaveBeenCalledWith('my-avatar-id');
  });
});
