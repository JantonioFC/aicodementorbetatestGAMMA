-- ==========================================
-- 10. COMMUNITY SYSTEM (Shared Lessons & Leaderboard)
-- ==========================================

-- Public lessons shared by users
CREATE TABLE IF NOT EXISTS shared_lessons (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    lesson_id TEXT NOT NULL, -- Reference to the original generated lesson or sandbox content
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    tags TEXT, -- JSON array
    content TEXT NOT NULL, -- Full lesson content (snapshot at sharing time)
    is_public INTEGER DEFAULT 1,
    views_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Votes to determine quality and ranking
CREATE TABLE IF NOT EXISTS shared_lesson_votes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    shared_lesson_id TEXT NOT NULL REFERENCES shared_lessons(id) ON DELETE CASCADE,
    vote_value INTEGER NOT NULL CHECK (vote_value IN (-1, 1)), -- Upvote (1) or Downvote (-1)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, shared_lesson_id)
);

-- Leaderboard system points and metrics
CREATE TABLE IF NOT EXISTS community_metrics (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    lessons_shared_count INTEGER DEFAULT 0,
    total_upvotes_received INTEGER DEFAULT 0,
    rank_title TEXT DEFAULT 'Novato',
    last_computed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast ranking
CREATE INDEX IF NOT EXISTS idx_community_metrics_points ON community_metrics(total_points DESC);
