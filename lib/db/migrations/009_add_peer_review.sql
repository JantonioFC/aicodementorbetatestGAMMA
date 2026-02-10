-- ==========================================
-- MIGRATION 009: Add Peer Review Tables
-- ==========================================

CREATE TABLE IF NOT EXISTS shared_lessons (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    lesson_id TEXT NOT NULL REFERENCES sandbox_generations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    is_public INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lesson_reviews (
    id TEXT PRIMARY KEY,
    shared_lesson_id TEXT NOT NULL REFERENCES shared_lessons(id) ON DELETE CASCADE,
    reviewer_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shared_lessons_owner ON shared_lessons(owner_id);
CREATE INDEX IF NOT EXISTS idx_lesson_reviews_shared ON lesson_reviews(shared_lesson_id);
