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
