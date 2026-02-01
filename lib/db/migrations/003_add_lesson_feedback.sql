-- ==========================================
-- MIGRATION 003: Add Lesson Feedback Table
-- ==========================================

-- Tabla para almacenar feedback de lecciones (Learning Analytics)
CREATE TABLE IF NOT EXISTS lesson_feedback (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    lesson_id TEXT NOT NULL,
    session_id TEXT REFERENCES learning_sessions(id),
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5), -- 1-5 estrellas
    was_helpful INTEGER DEFAULT 1, -- Boolean
    difficulty TEXT CHECK(difficulty IN ('TOO_EASY', 'JUST_RIGHT', 'TOO_HARD')),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices para análisis
CREATE INDEX IF NOT EXISTS idx_lesson_feedback_lesson_id ON lesson_feedback(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_feedback_rating ON lesson_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_lesson_feedback_user_id ON lesson_feedback(user_id);
