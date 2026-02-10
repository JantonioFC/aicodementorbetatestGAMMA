import * as fs from 'fs';
import * as path from 'path';
import { db } from '../db'; // Import singleton database instance

/**
 * Sistema de Migraciones Simple para SQLite
 * Ejecuta archivos .sql en orden alfabético desde lib/db/migrations
 */
export default function migrate(): void {
    console.log('🔄 Iniciando migraciones de base de datos...');

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
        console.log(`📂 Directorio de migraciones creado en: ${migrationsDir}`);
        return;
    }

    const files = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort(); // Orden alfabético asegura ejecución secuencial (001_..., 002_...)

    let appliedCount = 0;

    // 3. Ejecutar cada migración
    for (const file of files) {
        // Verificar si ya fue aplicada
        const isApplied = db.get<any>('SELECT 1 FROM _migrations WHERE name = ?', [file]);

        if (!isApplied) {
            console.log(`🚀 Aplicando migración: ${file}`);

            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, 'utf-8');

            try {
                // Ejecutar el SQL multiparte
                db.exec(sql);
                // Registrar la migración
                db.run('INSERT INTO _migrations (name) VALUES (?)', [file]);

                console.log(`✅ Migración completada: ${file}`);
                appliedCount++;
            } catch (error: any) {
                console.error(`❌ Error aplicando ${file}:`, error.message);
                throw error; // Detener proceso si una falla
            }
        }
    }

    if (appliedCount === 0) {
        console.log('✨ Base de datos actualizada (no hay migraciones pendientes).');
    } else {
        console.log(`🏁 Se aplicaron ${appliedCount} migraciones exitosamente.`);
    }
}
