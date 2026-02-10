-- ==========================================
-- MIGRATION 008: Add Achievements Table
-- ==========================================

CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    achievement_key TEXT NOT NULL, -- Identificador único del logro (ej: 'first_steps', 'loop_master')
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_key)
);

CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
