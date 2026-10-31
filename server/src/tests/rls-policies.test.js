import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Database Migrations and RLS Policy Specifications', () => {
  const migrationsDir = path.resolve(__dirname, '../../../supabase/migrations');
  const schemaFile = path.join(migrationsDir, '00001_initial_schema.sql');
  const rlsFile = path.join(migrationsDir, '00002_rls_and_security.sql');

  const readSql = (filePath) => fs.readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n');

  it('migration 00001_initial_schema.sql exists and contains core tables', () => {
    expect(fs.existsSync(schemaFile)).toBe(true);
    const sql = readSql(schemaFile);

    // Assert essential tables exist
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.profiles');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.admin_users');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.posts');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.post_media');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.conversations');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.conversation_participants');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.messages');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.reports');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.moderation_actions');

    // Assert canonical pair key on conversations
    expect(sql).toContain('direct_pair_key text UNIQUE');

    // Assert automated profile trigger on auth.users
    expect(sql).toContain('CREATE TRIGGER on_auth_user_created');
  });

  it('migration 00002_rls_and_security.sql enables RLS on all tables', () => {
    expect(fs.existsSync(rlsFile)).toBe(true);
    const sql = readSql(rlsFile);

    const expectedRlsTables = [
      'profiles',
      'admin_users',
      'posts',
      'post_media',
      'follows',
      'likes',
      'saved_posts',
      'comments',
      'blocks',
      'notifications',
      'conversations',
      'conversation_participants',
      'messages',
      'reports',
      'moderation_actions',
    ];

    for (const table of expectedRlsTables) {
      expect(sql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
    }
  });

  it('migration 00002 enforces zero-argument is_admin and safe search_path', () => {
    const sql = readSql(rlsFile);

    // Zero-argument is_admin resolving auth.uid() internally
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.is_admin()');
    expect(sql).toContain('WHERE user_id = auth.uid()');
    expect(sql).toContain('SET search_path = public, pg_temp');
    expect(sql).toContain('REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;');

    // Zero-argument is_active_user resolving auth.uid() internally
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.is_active_user()');
    expect(sql).toContain('WHERE id = auth.uid() \n      AND status = \'active\'');
    expect(sql).toContain('REVOKE ALL ON FUNCTION public.is_active_user() FROM PUBLIC, anon;');
  });

  it('migration 00002 enforces column-level privilege protection on profiles.role and profiles.status', () => {
    const sql = readSql(rlsFile);

    expect(sql).toContain('REVOKE UPDATE ON public.profiles FROM authenticated, anon, PUBLIC;');
    expect(sql).toContain('GRANT UPDATE (');
    expect(sql).not.toContain('GRANT UPDATE (role');
    expect(sql).not.toContain('GRANT UPDATE (status');

    // Trigger guard
    expect(sql).toContain('CREATE TRIGGER trg_guard_profile_privileged_fields');
    expect(sql).toContain('auth.role() <> \'service_role\'');
  });

  it('migration 00002 secures conversation provisioning and enforces message immutability', () => {
    const sql = readSql(rlsFile);

    // Revoke direct client INSERTs
    expect(sql).toContain('REVOKE INSERT ON public.conversations, public.conversation_participants FROM authenticated, anon, PUBLIC;');
    
    // Revoke direct message updates/deletes (immutability)
    expect(sql).toContain('REVOKE UPDATE, DELETE ON public.messages FROM authenticated, anon, PUBLIC;');

    // RPC with advisory locking and canonical key
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.start_or_get_direct_conversation');
    expect(sql).toContain('pg_advisory_xact_lock(hashtext(v_pair_key))');
    expect(sql).toContain('REVOKE ALL ON FUNCTION public.start_or_get_direct_conversation(uuid) FROM PUBLIC, anon;');
    expect(sql).toContain('GRANT EXECUTE ON FUNCTION public.start_or_get_direct_conversation(uuid) TO authenticated;');

    // Read receipt function
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.mark_conversation_read');
    expect(sql).toContain('UPDATE public.conversation_participants\n  SET last_read_at = now()');
  });

  it('migration 00002 restricts execute_admin_moderation exclusively to service_role', () => {
    const sql = readSql(rlsFile);

    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.execute_admin_moderation');
    expect(sql).toContain('auth.role() <> \'service_role\'');
    expect(sql).toContain('REVOKE ALL ON FUNCTION public.execute_admin_moderation(uuid, text, text, uuid, text, jsonb) FROM PUBLIC, anon, authenticated;');
    expect(sql).toContain('GRANT EXECUTE ON FUNCTION public.execute_admin_moderation(uuid, text, text, uuid, text, jsonb) TO service_role;');
  });

  it('migration 00003_phase4_social_features.sql configures post_media RLS, replies, and author moderation', () => {
    const phase4File = path.join(migrationsDir, '00003_phase4_social_features.sql');
    expect(fs.existsSync(phase4File)).toBe(true);
    const sql = readSql(phase4File);

    // Comments parent_id and hierarchy
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.comments(id)');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);');
    expect(sql).toContain('CHECK (parent_id IS NULL OR parent_id <> id)');

    // Post media RLS policies
    expect(sql).toContain('CREATE POLICY "Post media viewable on accessible posts"');
    expect(sql).toContain('CREATE POLICY "Authors can insert media on own posts"');
    expect(sql).toContain('CREATE POLICY "Authors can delete media from own posts"');

    // Helper function for bidirectional block checks
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.are_users_blocked');
    expect(sql).toContain('SET search_path = public, pg_temp');
    expect(sql).toContain('REVOKE ALL ON FUNCTION public.are_users_blocked(uuid, uuid) FROM PUBLIC, anon;');

    // Posts followers-only and block protection
    expect(sql).toContain('CREATE POLICY "Posts viewable by authorized users"');
    expect(sql).toContain('visibility = \'followers\'');
    expect(sql).toContain('NOT public.are_users_blocked(auth.uid(), posts.author_id)');

    // Reply integrity check in comment creation policy
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.is_valid_comment_parent');
    expect(sql).toContain('comments.parent_id IS NULL');
    expect(sql).toContain('public.is_valid_comment_parent(comments.parent_id, comments.post_id)');

    // Post author moderation on comments
    expect(sql).toContain('CREATE POLICY "Users can delete own comments or comments on own posts"');
    expect(sql).toContain('WHERE posts.id = comments.post_id\n        AND posts.author_id = auth.uid()');
  });
});
