import * as fs from 'fs';
import * as path from 'path';
import { db } from '../db'; // Import singleton database instance
import { logger } from '../observability/Logger';

/**
 * Sistema de Migraciones Simple para SQLite
 * Ejecuta archivos .sql en orden alfabético desde lib/db/migrations
 */
export default function migrate(): void {
    logger.info('Starting database migrations');

    // 1. Crear tabla de control de versiones si no existe
    db.exec(`
        CREATE TABLE IF NOT EXISTS _migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // 2. Leer archivos de migración
    const migrationsDir = path.join(__dirname, 'migrations');

    // Asegurar que el directorio existe
    if (!fs.existsSync(migrationsDir)) {
        fs.mkdirSync(migrationsDir, { recursive: true });
        logger.info('Migrations directory created', { path: migrationsDir });
        return;
    }

    const files = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort(); // Orden alfabético asegura ejecución secuencial (001_..., 002_...)

    let appliedCount = 0;

    // 3. Ejecutar cada migración
    for (const file of files) {
        // Verificar si ya fue aplicada
        const isApplied = db.get<{ '1': number }>('SELECT 1 FROM _migrations WHERE name = ?', [file]);

        if (!isApplied) {
            logger.info('Applying migration', { file });

            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, 'utf-8');

            try {
                // Ejecutar el SQL multiparte
                db.exec(sql);
                // Registrar la migración
                db.run('INSERT INTO _migrations (name) VALUES (?)', [file]);

                logger.info('Migration completed', { file });
                appliedCount++;
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : String(error);
                logger.error(`Error applying migration ${file}`, { error: message });
                throw error; // Detener proceso si una falla
            }
        }
    }

    if (appliedCount === 0) {
        logger.info('Database up to date, no pending migrations');
    } else {
        logger.info('Migrations applied successfully', { count: appliedCount });
    }
}
