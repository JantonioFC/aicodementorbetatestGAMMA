-- ==========================================
-- MIGRATION 004: Add Lesson Evaluations Table
-- ==========================================

-- Tabla para almacenar evaluaciones automáticas de lecciones
CREATE TABLE IF NOT EXISTS lesson_evaluations (
    id TEXT PRIMARY KEY,
    lesson_id TEXT NOT NULL,
    session_id TEXT REFERENCES learning_sessions(id),
    user_id TEXT REFERENCES user_profiles(id),
    
    -- Scores individuales (0-100)
    faithfulness_score REAL,      -- ¿Menciona el tema del pomodoro?
    relevance_score REAL,         -- ¿Usa términos del contexto RAG?
    length_score REAL,            -- ¿Cumple mínimo de palabras?
    structure_score REAL,         -- ¿Tiene título, ejemplos, quiz?
    no_hallucination_score REAL,  -- ¿Evita términos prohibidos?
    
    -- Score agregado
    overall_score REAL,           -- Promedio ponderado
    
    -- Metadata
    details TEXT,                 -- JSON con detalles del análisis
    word_count INTEGER,
    has_examples INTEGER DEFAULT 0,
    has_quiz INTEGER DEFAULT 0,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices para análisis
CREATE INDEX IF NOT EXISTS idx_lesson_evaluations_lesson_id ON lesson_evaluations(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_evaluations_overall_score ON lesson_evaluations(overall_score);
CREATE INDEX IF NOT EXISTS idx_lesson_evaluations_created_at ON lesson_evaluations(created_at);
