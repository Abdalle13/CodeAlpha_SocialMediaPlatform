-- ============================================================
-- Migration 00007: Stories (24-hour disappearing posts)
-- ============================================================

-- Stories table
CREATE TABLE IF NOT EXISTS stories (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID        REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  image_url       TEXT        NOT NULL,
  imagekit_file_id TEXT,
  caption         TEXT        CHECK (char_length(caption) <= 200),
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at      TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours') NOT NULL
);

-- Indexes for fast expiry + user queries
CREATE INDEX IF NOT EXISTS idx_stories_user_id    ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at);

-- Story views table (track who viewed which story)
CREATE TABLE IF NOT EXISTS story_views (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id   UUID        REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  viewer_id  UUID        REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  viewed_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(story_id, viewer_id)
);

CREATE INDEX IF NOT EXISTS idx_story_views_story_id  ON story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewer_id ON story_views(viewer_id);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE stories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

-- Users can always see their own stories (even expired, for management)
CREATE POLICY "stories_own_select" ON stories
  FOR SELECT USING (auth.uid() = user_id);

-- Users can see active (non-expired) stories from people they follow
CREATE POLICY "stories_followed_select" ON stories
  FOR SELECT USING (
    expires_at > NOW()
    AND EXISTS (
      SELECT 1 FROM follows
      WHERE follows.follower_id  = auth.uid()
        AND follows.following_id = stories.user_id
    )
  );

-- Users can insert their own stories
CREATE POLICY "stories_own_insert" ON stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own stories
CREATE POLICY "stories_own_delete" ON stories
  FOR DELETE USING (auth.uid() = user_id);

-- Story views: users can record their own views
CREATE POLICY "story_views_own_insert" ON story_views
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- Story owners can see who viewed their stories
CREATE POLICY "story_views_owner_select" ON story_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id      = story_views.story_id
        AND stories.user_id = auth.uid()
    )
    OR auth.uid() = viewer_id
  );

