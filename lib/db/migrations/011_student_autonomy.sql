-- Personal target profiles for students (e.g., "Frontend Developer", "Python Expert")
CREATE TABLE IF NOT EXISTS learning_paths (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    target_profile TEXT, -- Concept or job title the path aims for
    status TEXT DEFAULT 'active', -- active, completed, paused
    current_step_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Individual steps in a learning path
CREATE TABLE IF NOT EXISTS path_steps (
    id TEXT PRIMARY KEY,
    path_id TEXT NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    topic TEXT NOT NULL,
    estimated_difficulty TEXT,
    resource_type TEXT, -- lesson, exercise, project
    resource_id TEXT, -- ID of the generated lesson or exercise
    status TEXT DEFAULT 'pending', -- pending, completed, skipped
    reasoning TEXT, -- AI's reason for including this step
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Skill gap snapshots for analysis
CREATE TABLE IF NOT EXISTS skill_gaps (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    current_level INTEGER DEFAULT 0,
    target_level INTEGER DEFAULT 3,
    gap_score REAL, -- Target - Current
    last_analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_path_steps_path ON path_steps(path_id);
CREATE INDEX IF NOT EXISTS idx_skill_gaps_user ON skill_gaps(user_id);
