/**
 * Script de backup de base de datos para ejecución manual o cron
 */
const backupService = require('../lib/db/BackupService');

async function run() {
    console.log('--- 🛡️  Iniciando Respaldo de Base de Datos ---');
    try {
        const path = await backupService.runBackup();
        console.log(`--- ✅ Respaldo finalizado: ${path} ---`);
        process.exit(0);
    } catch (error) {
        console.error('--- ❌ Error en el respaldo ---');
        console.error(error);
        process.exit(1);
    }
}

run();
