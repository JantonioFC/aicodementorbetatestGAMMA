-- ==========================================
-- 1. CURRICULUM (Static)
-- ==========================================
CREATE TABLE IF NOT EXISTS fases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fase INTEGER UNIQUE NOT NULL,
    titulo_fase TEXT NOT NULL,
    duracion_meses TEXT,
    proposito TEXT
);

CREATE TABLE IF NOT EXISTS modulos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fase_id INTEGER REFERENCES fases(id),
    modulo INTEGER NOT NULL,
    titulo_modulo TEXT NOT NULL,
    UNIQUE(fase_id, modulo)
);

CREATE TABLE IF NOT EXISTS semanas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    modulo_id INTEGER REFERENCES modulos(id),
    semana INTEGER UNIQUE NOT NULL,
    titulo_semana TEXT NOT NULL,
    objetivos TEXT,      -- JSON array
    tematica TEXT,
    actividades TEXT,    -- JSON array
    entregables TEXT,
    recursos TEXT,       -- JSON array
    official_sources TEXT, -- JSON array
    ejercicios TEXT,     -- JSON array
    guia_estudio TEXT
);

CREATE TABLE IF NOT EXISTS esquema_diario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    semana_id INTEGER REFERENCES semanas(id),
    dia INTEGER NOT NULL,
    concepto TEXT,
    pomodoros TEXT       -- JSON array
);

-- ==========================================
-- 2. USER PROFILES & AUTH
-- ==========================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id TEXT PRIMARY KEY, -- UUID from local auth
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    token_version INTEGER DEFAULT 1,
    display_name TEXT,
    bio TEXT,
    learning_goals TEXT,
    preferences TEXT DEFAULT '{}', -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. PROGRESS TRACKING
-- ==========================================
CREATE TABLE IF NOT EXISTS est_progress (
    id TEXT PRIMARY KEY, -- UUID
    user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    semana_id INTEGER NOT NULL,
    checked_state TEXT NOT NULL DEFAULT '{"ejercicios": false, "miniProyecto": false, "dma": false, "commits": false}', -- JSON
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, semana_id)
);

CREATE TABLE IF NOT EXISTS user_lesson_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES user_profiles(id) ON DELETE CASCADE,
    lesson_id TEXT NOT NULL,
    completed INTEGER DEFAULT 0, -- Boolean (0/1)
    completed_at DATETIME,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    time_spent_seconds INTEGER DEFAULT 0,
    progress_data TEXT DEFAULT '{}', -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS user_exercise_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES user_profiles(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL,
    lesson_id TEXT,
    completed INTEGER DEFAULT 0,
    completed_at DATETIME,
    attempts_count INTEGER DEFAULT 0,
    best_score INTEGER DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,
    solution_data TEXT DEFAULT '{}', -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, exercise_id)
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES user_profiles(id) ON DELETE CASCADE,
    lesson_id TEXT NOT NULL,
    question_index INTEGER NOT NULL,
    user_answer TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    is_correct INTEGER NOT NULL, -- Boolean
    time_spent_seconds INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS curriculum_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    module_id TEXT,
    phase_id TEXT,
    week_id TEXT,
    completed INTEGER DEFAULT 0,
    progress_percentage INTEGER DEFAULT 0,
    last_accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 4. GENERATED CONTENT (Sandbox & AI)
-- ==========================================
CREATE TABLE IF NOT EXISTS generated_content (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    semana_id INTEGER NOT NULL,
    dia_index INTEGER NOT NULL,
    pomodoro_index INTEGER NOT NULL,
    content TEXT NOT NULL, -- JSON content
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sandbox_generations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    custom_content TEXT NOT NULL,
    title TEXT NOT NULL,
    generated_lesson TEXT NOT NULL, -- JSON
    metadata TEXT DEFAULT '{}', -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 5. ACHIEVEMENTS
-- ==========================================
CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    icon TEXT,
    criteria TEXT NOT NULL, -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_achievements (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);

-- Seed Initial Achievements (SAFE: ON CONFLICT DO NOTHING)
INSERT INTO achievements (id, name, description, icon, criteria) VALUES 
('mvp-1', 'Primer Paso', 'Completa tu primera semana en el Ecosistema 360.', '🚀', '{"type": "COMPLETE_WEEKS", "value": 1}'),
('mvp-2', 'Persistente', 'Completa 5 semanas del programa.', '💪', '{"type": "COMPLETE_WEEKS", "value": 5}'),
('mvp-3', 'Explorador de Fase', 'Completa la Fase 1: Fundamentos y Metodología.', '🎯', '{"type": "COMPLETE_PHASE", "value": 1}'),
('mvp-4', 'Progresivo', 'Alcanza el 50% de progreso total en el programa.', '📈', '{"type": "PROGRESS_PERCENTAGE", "value": 50}')
ON CONFLICT(name) DO NOTHING;

-- ==========================================
-- 6. CONTENT CACHE (ARM)
-- ==========================================
CREATE TABLE IF NOT EXISTS source_content_cache (
    url TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    last_fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME
);

-- ==========================================
-- 7. IRP SYSTEM (Peer Review)
-- ==========================================
CREATE TABLE IF NOT EXISTS irp_review_requests (
    id TEXT PRIMARY KEY,
    author_user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    project_name TEXT NOT NULL,
    github_repo_url TEXT NOT NULL,
    pull_request_url TEXT,
    phase INTEGER NOT NULL,
    week INTEGER NOT NULL,
    description TEXT NOT NULL,
    learning_objectives TEXT DEFAULT '[]', -- JSON array
    specific_focus TEXT DEFAULT '[]', -- JSON array
    status TEXT DEFAULT 'PENDING_ASSIGNMENT' CHECK(status IN ('PENDING_ASSIGNMENT', 'ASSIGNED', 'COMPLETED', 'EXPIRED')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS irp_review_assignments (
    id TEXT PRIMARY KEY,
    review_request_id TEXT NOT NULL REFERENCES irp_review_requests(id) ON DELETE CASCADE,
    reviewer_user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    due_date DATETIME NOT NULL,
    status TEXT DEFAULT 'ASSIGNED' CHECK(status IN ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE')),
    review_criteria TEXT DEFAULT '[]' -- JSON array
);

CREATE TABLE IF NOT EXISTS irp_peer_reviews (
    id TEXT PRIMARY KEY,
    review_request_id TEXT NOT NULL REFERENCES irp_review_requests(id) ON DELETE CASCADE,
    review_assignment_id TEXT REFERENCES irp_review_assignments(id),
    reviewer_user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    puntos_fuertes TEXT DEFAULT '[]', -- JSON
    sugerencias_mejora TEXT DEFAULT '[]', -- JSON
    preguntas_reflexion TEXT DEFAULT '[]', -- JSON
    calificacion_general TEXT DEFAULT '{}', -- JSON
    tiempo_revision_horas REAL DEFAULT 0,
    recomendacion TEXT NOT NULL CHECK(recomendacion IN ('APPROVE', 'APPROVE_WITH_MINOR_CHANGES', 'MAJOR_REVISION_NEEDED')),
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    github_comment_url TEXT
);

CREATE TABLE IF NOT EXISTS irp_user_metrics (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    total_reviews_completed INTEGER DEFAULT 0,
    total_reviews_received INTEGER DEFAULT 0,
    average_review_time_hours REAL DEFAULT 0,
    average_rating_given REAL DEFAULT 0,
    average_rating_received REAL DEFAULT 0,
    quality_score REAL DEFAULT 0,
    punctuality_rate REAL DEFAULT 0,
    peer_points_total INTEGER DEFAULT 0,
    current_level TEXT DEFAULT 'Beginner Reviewer',
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS irp_audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    details TEXT, -- JSON
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
