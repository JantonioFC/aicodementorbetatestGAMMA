-- ==========================================
-- MIGRATION 002: Add Session Memory Tables
-- ==========================================

-- Tabla para almacenar sesiones de aprendizaje
CREATE TABLE IF NOT EXISTS learning_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    week_id INTEGER,
    status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'PAUSED', 'COMPLETED')),
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,
    metadata TEXT DEFAULT '{}' -- JSON: últimas lecciones vistas, preferencias, etc.
);

-- Tabla para almacenar el historial de interacciones dentro de una sesión
CREATE TABLE IF NOT EXISTS session_interactions (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL CHECK(interaction_type IN ('LESSON_GENERATED', 'QUIZ_ANSWERED', 'FEEDBACK_GIVEN', 'NOTE_ADDED')),
    content TEXT NOT NULL, -- JSON con el contenido relevante (ej: prompt enviado, respuesta recibida)
    tokens_used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_id ON learning_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_status ON learning_sessions(status);
CREATE INDEX IF NOT EXISTS idx_session_interactions_session_id ON session_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_session_interactions_type ON session_interactions(interaction_type);
