-- ==========================================
-- MIGRATION 007: Add Competency Log Table
-- ==========================================

CREATE TABLE IF NOT EXISTS competency_log (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    competency_name TEXT NOT NULL,
    competency_category TEXT NOT NULL DEFAULT 'General',
    level_achieved INTEGER NOT NULL DEFAULT 1,
    evidence_description TEXT NOT NULL,
    achieved_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsqueda por usuario y categoría
CREATE INDEX IF NOT EXISTS idx_competency_log_user_id ON competency_log(user_id);
CREATE INDEX IF NOT EXISTS idx_competency_log_category ON competency_log(competency_category);
CREATE INDEX IF NOT EXISTS idx_competency_log_name ON competency_log(competency_name);
