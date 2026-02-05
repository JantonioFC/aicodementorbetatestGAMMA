const db = require('../lib/db');

console.log('⚡ Optimizando Base de Datos (Indices)...');

try {
    db.exec(`
        -- PERF-02: Indices para tablas críticas
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON user_lesson_progress(user_id);
        CREATE INDEX IF NOT EXISTS idx_est_progress_user ON est_progress(user_id);
        
        -- Mantenimiento
        VACUUM;
        ANALYZE;
    `);
    console.log('✅ Base de datos optimizada: Indices creados + VACUUM/ANALYZE.');
} catch (e) {
    console.error('❌ Error optimizando DB:', e);
    process.exit(1);
}
