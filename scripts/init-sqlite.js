const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Configuration
const DB_PATH = path.join(__dirname, '..', 'database', 'sqlite', 'curriculum.db');
const JSON_SOURCE = path.join(__dirname, '..', 'data', 'curriculum_rag_v3.json');

// Colors for console
const c = { green: '\x1b[32m', cyan: '\x1b[36m', red: '\x1b[31m', reset: '\x1b[0m', yellow: '\x1b[33m' };
const log = (msg, color = 'reset') => console.log(`${c[color]}${msg}${c.reset}`);

function initDatabase() {
    log('🚀 Starting SQLite Initialization...', 'cyan');

    // 1. Ensure directory exists
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
        log(`creating directory: ${dbDir}`, 'yellow');
        fs.mkdirSync(dbDir, { recursive: true });
    }

    // 2. Connect to DB
    const force = process.argv.includes('--force');

    if (fs.existsSync(DB_PATH) && !force) {
        log(`✅ Database exists at ${DB_PATH}`, 'green');
        // Check if tables exist/count weeks to verify it's not empty?
        // For now, just assume it's good to avoid EBUSY on dev server restart.
        // We return early.
        log('   Skipping re-initialization. Use --force to overwrite.', 'dim');
        return;
    }

    if (fs.existsSync(DB_PATH) && force) {
        log(`Deleting existing database: ${DB_PATH}`, 'yellow');
        try {
            fs.unlinkSync(DB_PATH);
        } catch (e) {
            log(`⚠️ Could not delete DB: ${e.message}`, 'red');
        }
    }

    const db = new Database(DB_PATH);
    log(`✅ Connected to ${DB_PATH}`, 'green');

    try {
        // 3. Create Tables
        log('📊 Creating schema...', 'cyan');

        db.exec(`
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

          -- Seed Initial Achievements
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

          -- ==========================================
          -- 8. AUTH TOKENS (Refresh + PAT + Device)
          -- ==========================================
          CREATE TABLE IF NOT EXISTS refresh_tokens (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL,
              token TEXT NOT NULL UNIQUE,
              expires_at DATETIME NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              revoked BOOLEAN DEFAULT 0,
              FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
          );

          CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
          CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);

          CREATE TABLE IF NOT EXISTS personal_access_tokens (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              token_hash TEXT NOT NULL UNIQUE,
              user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
              label TEXT,
              last_used_at DATETIME,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              expires_at DATETIME
          );

          CREATE INDEX IF NOT EXISTS idx_pats_user_id ON personal_access_tokens(user_id);

          CREATE TABLE IF NOT EXISTS device_codes (
              code TEXT PRIMARY KEY,
              device_code TEXT NOT NULL UNIQUE,
              status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'authorized', 'expired', 'denied')),
              user_id TEXT REFERENCES user_profiles(id) ON DELETE CASCADE,
              expires_at DATETIME NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          CREATE INDEX IF NOT EXISTS idx_device_codes_device_code ON device_codes(device_code);

          -- ==========================================
          -- 9. LEARNING SESSIONS
          -- ==========================================
          CREATE TABLE IF NOT EXISTS learning_sessions (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
              week_id INTEGER,
              status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'PAUSED', 'COMPLETED')),
              started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              ended_at DATETIME,
              metadata TEXT DEFAULT '{}'
          );

          CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_id ON learning_sessions(user_id);
          CREATE INDEX IF NOT EXISTS idx_learning_sessions_status ON learning_sessions(status);

          CREATE TABLE IF NOT EXISTS session_interactions (
              id TEXT PRIMARY KEY,
              session_id TEXT NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
              interaction_type TEXT NOT NULL CHECK(interaction_type IN ('LESSON_GENERATED', 'QUIZ_ANSWERED', 'FEEDBACK_GIVEN', 'NOTE_ADDED')),
              content TEXT NOT NULL,
              tokens_used INTEGER DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          CREATE INDEX IF NOT EXISTS idx_session_interactions_session_id ON session_interactions(session_id);

          -- ==========================================
          -- 10. LESSON FEEDBACK & EVALUATIONS
          -- ==========================================
          CREATE TABLE IF NOT EXISTS lesson_feedback (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
              lesson_id TEXT NOT NULL,
              session_id TEXT REFERENCES learning_sessions(id),
              rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
              was_helpful INTEGER DEFAULT 1,
              difficulty TEXT CHECK(difficulty IN ('TOO_EASY', 'JUST_RIGHT', 'TOO_HARD')),
              comment TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          CREATE INDEX IF NOT EXISTS idx_lesson_feedback_lesson_id ON lesson_feedback(lesson_id);
          CREATE INDEX IF NOT EXISTS idx_lesson_feedback_user_id ON lesson_feedback(user_id);

          CREATE TABLE IF NOT EXISTS lesson_evaluations (
              id TEXT PRIMARY KEY,
              lesson_id TEXT NOT NULL,
              session_id TEXT REFERENCES learning_sessions(id),
              user_id TEXT REFERENCES user_profiles(id),
              faithfulness_score REAL,
              relevance_score REAL,
              length_score REAL,
              structure_score REAL,
              no_hallucination_score REAL,
              overall_score REAL,
              details TEXT,
              word_count INTEGER,
              has_examples INTEGER DEFAULT 0,
              has_quiz INTEGER DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          -- ==========================================
          -- 11. COMPETENCY & COMMUNITY
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

          CREATE INDEX IF NOT EXISTS idx_competency_log_user_id ON competency_log(user_id);

          CREATE TABLE IF NOT EXISTS shared_lessons (
              id TEXT PRIMARY KEY,
              owner_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
              lesson_id TEXT NOT NULL,
              title TEXT NOT NULL,
              description TEXT,
              category TEXT,
              tags TEXT,
              content TEXT NOT NULL,
              is_public INTEGER DEFAULT 1,
              views_count INTEGER DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          CREATE INDEX IF NOT EXISTS idx_shared_lessons_owner ON shared_lessons(owner_id);

          CREATE TABLE IF NOT EXISTS shared_lesson_votes (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
              shared_lesson_id TEXT NOT NULL REFERENCES shared_lessons(id) ON DELETE CASCADE,
              vote_value INTEGER NOT NULL CHECK (vote_value IN (-1, 1)),
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              UNIQUE(user_id, shared_lesson_id)
          );

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

          -- ==========================================
          -- 12. LEARNING PATHS (Student Autonomy)
          -- ==========================================
          CREATE TABLE IF NOT EXISTS learning_paths (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
              title TEXT NOT NULL,
              description TEXT,
              target_profile TEXT,
              status TEXT DEFAULT 'active',
              current_step_index INTEGER DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS path_steps (
              id TEXT PRIMARY KEY,
              path_id TEXT NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
              step_number INTEGER NOT NULL,
              topic TEXT NOT NULL,
              estimated_difficulty TEXT,
              resource_type TEXT,
              resource_id TEXT,
              status TEXT DEFAULT 'pending',
              reasoning TEXT,
              completed_at DATETIME,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          CREATE INDEX IF NOT EXISTS idx_path_steps_path ON path_steps(path_id);

          CREATE TABLE IF NOT EXISTS skill_gaps (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
              topic TEXT NOT NULL,
              current_level INTEGER DEFAULT 0,
              target_level INTEGER DEFAULT 3,
              gap_score REAL,
              last_analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          CREATE INDEX IF NOT EXISTS idx_skill_gaps_user ON skill_gaps(user_id);
      `);
        log('✅ Schema created.', 'green');

        // 4. Load Data
        log(`📖 Reading source data from ${JSON_SOURCE}...`, 'cyan');
        if (!fs.existsSync(JSON_SOURCE)) {
            throw new Error(`Source file not found: ${JSON_SOURCE}`);
        }

        const rawData = fs.readFileSync(JSON_SOURCE, 'utf8');
        const curriculumData = JSON.parse(rawData);

        // 5. Insert Data
        log('💾 Seeding data...', 'cyan');

        const insertFase = db.prepare(`
          INSERT INTO fases (fase, titulo_fase, duracion_meses, proposito)
          VALUES (@fase, @tituloFase, @duracionMeses, @proposito)
      `);

        const insertModulo = db.prepare(`
          INSERT INTO modulos (fase_id, modulo, titulo_modulo)
          VALUES (@faseId, @modulo, @tituloModulo)
      `);

        const insertSemana = db.prepare(`
          INSERT INTO semanas (
              modulo_id, semana, titulo_semana, objetivos, tematica, 
              actividades, entregables, recursos, official_sources, ejercicios, guia_estudio
          )
          VALUES (
              @moduloId, @semana, @tituloSemana, @objetivos, @tematica, 
              @actividades, @entregables, @recursos, @officialSources, @ejercicios, @guiaEstudio
          )
      `);

        const insertEsquema = db.prepare(`
          INSERT INTO esquema_diario (semana_id, dia, concepto, pomodoros)
          VALUES (@semanaId, @dia, @concepto, @pomodoros)
      `);

        // Transaction for speed and atomicity
        const populate = db.transaction((data) => {
            let faseCount = 0;
            let moduloCount = 0;
            let semanaCount = 0;
            let esquemaCount = 0;

            // Process Phases
            for (const fase of data.curriculum) {
                const faseResult = insertFase.run({
                    fase: fase.fase,
                    tituloFase: fase.tituloFase,
                    duracionMeses: fase.duracionMeses,
                    proposito: fase.proposito
                });
                const faseId = faseResult.lastInsertRowid;
                faseCount++;

                // Process Modules
                if (fase.modulos) {
                    for (const modulo of fase.modulos) {
                        const moduloResult = insertModulo.run({
                            faseId: faseId,
                            modulo: modulo.modulo,
                            tituloModulo: modulo.tituloModulo
                        });
                        const moduloId = moduloResult.lastInsertRowid;
                        moduloCount++;

                        // Process Weeks
                        if (modulo.semanas) {
                            for (const semana of modulo.semanas) {
                                // Safely serialize JSON fields
                                const safeJson = (val) => val ? JSON.stringify(val) : '[]';

                                const semanaResult = insertSemana.run({
                                    moduloId: moduloId,
                                    semana: semana.semana,
                                    tituloSemana: semana.tituloSemana,
                                    objetivos: safeJson(semana.objetivos),
                                    tematica: semana.tematica || '',
                                    actividades: safeJson(semana.actividades),
                                    entregables: semana.entregables || '',
                                    recursos: safeJson(semana.recursos),
                                    officialSources: safeJson(semana.official_sources),
                                    ejercicios: safeJson(semana.ejercicios),
                                    guiaEstudio: semana.guia_estudio || null
                                });
                                const semanaId = semanaResult.lastInsertRowid;
                                semanaCount++;

                                // Process Daily Scheme
                                if (semana.esquemaDiario && Array.isArray(semana.esquemaDiario)) {
                                    for (const dia of semana.esquemaDiario) {
                                        insertEsquema.run({
                                            semanaId: semanaId,
                                            dia: dia.dia,
                                            concepto: dia.concepto,
                                            pomodoros: safeJson(dia.pomodoros)
                                        });
                                        esquemaCount++;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            return { faseCount, moduloCount, semanaCount, esquemaCount };
        });

        const stats = populate(curriculumData);

        // Register all migrations as applied (schema is already up-to-date)
        db.exec(`
          CREATE TABLE IF NOT EXISTS _migrations (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL UNIQUE,
              applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);
        const migrationFiles = [
            '001_initial_schema.sql', '002_add_sessions.sql', '003_add_lesson_feedback.sql',
            '004_add_lesson_evaluations.sql', '005_add_refresh_tokens.sql', '006-device-flow.sql',
            '007_add_competency_log.sql', '008_add_achievements.sql', '009_add_peer_review.sql',
            '010_community_system.sql', '011_student_autonomy.sql', '012_add_auth_columns.sql'
        ];
        const insertMigration = db.prepare('INSERT OR IGNORE INTO _migrations (name) VALUES (?)');
        for (const mig of migrationFiles) {
            insertMigration.run(mig);
        }
        log('✅ Migrations registered as applied.', 'green');

        log('✅ Initialization Complete!', 'green');
        console.log(`Summary:
      - Phases: ${stats.faseCount}
      - Modules: ${stats.moduloCount}
      - Weeks: ${stats.semanaCount}
      - Daily Entries: ${stats.esquemaCount}
      `);

    } catch (error) {
        log(`❌ Error: ${error.message}`, 'red');
        console.error(error);
    } finally {
        db.close();
        log('🔒 Connection closed.', 'dim');
    }
}

// Export for auto-setup
module.exports = { initDatabase };

// Run if called directly
if (require.main === module) {
    initDatabase();
}
