const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { logger } = require('../utils/logger');

/**
 * BackupService - Maneja respaldos automáticos de la base de datos SQLite
 */
class BackupService {
    constructor() {
        this.dbPath = path.join(process.cwd(), 'database', 'sqlite', 'curriculum.db');
        this.backupDir = path.join(process.cwd(), 'database', 'backups');
        this.maxBackups = 7; // Mantener última semana
    }

    /**
     * Inicializar servicio (crear carpetas)
     */
    init() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
            console.log(`📂 [BackupService] Directorio de backups creado: ${this.backupDir}`);
        }
    }

    /**
     * Ejecutar backup de la base de datos y comprimirlo
     * @returns {Promise<string>} - Ruta del archivo zip creado
     */
    async runBackup() {
        this.init();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const dbBackupPath = path.join(this.backupDir, `curriculum-temp-${timestamp}.db`);
        const zipFileName = `curriculum-backup-${timestamp}.zip`;
        const zipPath = path.join(this.backupDir, zipFileName);

        console.log(`🚀 [BackupService] Iniciando backup: ${zipFileName}...`);

        try {
            // 1. Crear copia física de la DB usando el API de better-sqlite3
            const db = new Database(this.dbPath);
            await db.backup(dbBackupPath);
            db.close();

            // 2. Comprimir el archivo .db en un .zip
            await this.compressFile(dbBackupPath, zipPath, `curriculum.db`);

            // 3. Limpiar el temporal .db
            fs.unlinkSync(dbBackupPath);

            console.log(`✅ [BackupService] Backup completado y comprimido: ${zipPath}`);

            // Rotación de backups
            this.rotateBackups();

            return zipPath;
        } catch (error) {
            console.error(`❌ [BackupService] Error durante el backup:`, error);
            if (fs.existsSync(dbBackupPath)) fs.unlinkSync(dbBackupPath);
            throw error;
        }
    }

    /**
     * Comprimir un archivo usando archiver
     */
    async compressFile(sourcePath, outPath, internalName) {
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(outPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', resolve);
            archive.on('error', reject);

            archive.pipe(output);
            archive.file(sourcePath, { name: internalName });
            archive.finalize();
        });
    }

    /**
     * Mantener solo los últimos N backups
     */
    rotateBackups() {
        try {
            const files = fs.readdirSync(this.backupDir)
                .filter(f => f.startsWith('curriculum-backup-') && f.endsWith('.zip'))
                .map(f => ({
                    name: f,
                    path: path.join(this.backupDir, f),
                    time: fs.statSync(path.join(this.backupDir, f)).mtime.getTime()
                }))
                .sort((a, b) => b.time - a.time); // Más nuevos primero

            if (files.length > this.maxBackups) {
                const toDelete = files.slice(this.maxBackups);
                toDelete.forEach(file => {
                    fs.unlinkSync(file.path);
                    console.log(`🗑️ [BackupService] Backup antiguo eliminado (rotación): ${file.name}`);
                });
            }
        } catch (error) {
            console.warn(`⚠️ [BackupService] Error durante la rotación:`, error.message);
        }
    }

    /**
     * Listar backups disponibles
     */
    listBackups() {
        this.init();
        return fs.readdirSync(this.backupDir)
            .filter(f => f.endsWith('.zip'))
            .map(f => ({
                name: f,
                size: fs.statSync(path.join(this.backupDir, f)).size,
                createdAt: fs.statSync(path.join(this.backupDir, f)).mtime
            }))
            .sort((a, b) => b.createdAt - a.createdAt);
    }
}

const backupService = new BackupService();
module.exports = backupService;
