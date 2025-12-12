/**
 * SCRIPT: AUTO-SETUP (LOCAL FIRST)
 * 
 * Este script automatiza el setup de la base de datos LOCAL (SQLite).
 * Ya no depende de Supabase.
 * 
 * Uso: Se ejecuta automáticamente con `npm run dev`
 */

const fs = require('fs');
const path = require('path');
const { initDatabase } = require('./init-sqlite'); // Reutilizamos la lógica de init

// Colores para consola
const c = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    dim: '\x1b[2m'
};
const log = (msg, color = 'reset') => console.log(`${c[color]}${msg}${c.reset}`);

async function autoSetup() {
    console.log('');
    log('╔══════════════════════════════════════════════════════════╗', 'cyan');
    log('║           🔧 AUTO-SETUP - AI CODE MENTOR (LOCAL)         ║', 'cyan');
    log('╚══════════════════════════════════════════════════════════╝', 'cyan');

    // 1. Inicializar SQLite (Esquema + Datos)
    log('🗄️  [SQLITE] Comprobando base de datos local...', 'dim');
    try {
        // initDatabase maneja su propia lógica de "si existe no hago nada salvo --force"
        initDatabase();
    } catch (e) {
        log(`⚠️  Error inicializando SQLite: ${e.message}`, 'yellow');
    }

    log('\n╔══════════════════════════════════════════════════════════╗', 'cyan');
    log('║              🚀 SETUP COMPLETADO                         ║', 'cyan');
    log('╚══════════════════════════════════════════════════════════╝\n', 'cyan');
}

// Ejecutar
autoSetup().catch(err => {
    log(`⚠️  Error: ${err.message}`, 'yellow');
});
