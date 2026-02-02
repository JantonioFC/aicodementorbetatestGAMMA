#!/usr/bin/env node

/**
 * validate-project.js
 * Script de validación del proyecto AI Code Mentor.
 * Verifica estructura, configuración y salud general.
 * 
 * Uso: node scripts/validate-project.js
 */

const fs = require('fs');
const path = require('path');

// Colores para terminal
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

const log = {
    pass: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    fail: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`)
};

const ROOT = path.resolve(__dirname, '..');
let errors = 0;
let warnings = 0;

// ============================================
// 1. Archivos Requeridos
// ============================================
console.log('\n📁 Verificando archivos requeridos...\n');

const requiredFiles = [
    'package.json',
    'next.config.js',
    'tsconfig.json',
    '.gitignore',
    '.env.example',
    'README.md',
    'pages/_app.js',
    'pages/index.js'
];

requiredFiles.forEach(file => {
    const filePath = path.join(ROOT, file);
    if (fs.existsSync(filePath)) {
        log.pass(file);
    } else {
        log.fail(`${file} - FALTA`);
        errors++;
    }
});

// ============================================
// 2. Directorios Requeridos
// ============================================
console.log('\n📂 Verificando directorios...\n');

const requiredDirs = [
    'pages',
    'pages/api',
    'components',
    'lib',
    'styles',
    'docs',
    '__tests__'
];

requiredDirs.forEach(dir => {
    const dirPath = path.join(ROOT, dir);
    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
        log.pass(dir);
    } else {
        log.fail(`${dir}/ - FALTA`);
        errors++;
    }
});

// ============================================
// 3. package.json Validación
// ============================================
console.log('\n📦 Verificando package.json...\n');

try {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

    // Scripts requeridos
    const requiredScripts = ['dev', 'build', 'start', 'test'];
    requiredScripts.forEach(script => {
        if (pkg.scripts && pkg.scripts[script]) {
            log.pass(`Script: ${script}`);
        } else {
            log.fail(`Script faltante: ${script}`);
            errors++;
        }
    });

    // Dependencias críticas
    const criticalDeps = ['next', 'react', 'react-dom'];
    criticalDeps.forEach(dep => {
        if (pkg.dependencies && pkg.dependencies[dep]) {
            log.pass(`Dependencia: ${dep}`);
        } else {
            log.fail(`Dependencia faltante: ${dep}`);
            errors++;
        }
    });

} catch (e) {
    log.fail('No se pudo leer package.json');
    errors++;
}

// ============================================
// 4. Variables de Entorno
// ============================================
console.log('\n🔐 Verificando configuración de entorno...\n');

const envExample = path.join(ROOT, '.env.example');
const envLocal = path.join(ROOT, '.env.local');

if (fs.existsSync(envExample)) {
    log.pass('.env.example existe');
} else {
    log.warn('.env.example no encontrado');
    warnings++;
}

if (fs.existsSync(envLocal)) {
    log.pass('.env.local existe (configuración local)');
} else {
    log.warn('.env.local no encontrado - crear desde .env.example');
    warnings++;
}

// ============================================
// 5. Documentación
// ============================================
console.log('\n📚 Verificando documentación...\n');

const docsPath = path.join(ROOT, 'docs');
if (fs.existsSync(docsPath)) {
    const docs = fs.readdirSync(docsPath).filter(f => f.endsWith('.md'));
    log.info(`Encontrados ${docs.length} documentos en docs/`);
    if (docs.length < 5) {
        log.warn('Documentación escasa (<5 archivos)');
        warnings++;
    } else {
        log.pass('Documentación adecuada');
    }
}

// ============================================
// 6. Tests
// ============================================
console.log('\n🧪 Verificando tests...\n');

const testsDir = path.join(ROOT, '__tests__');
const legacyTestsDir = path.join(ROOT, 'tests');

let testCount = 0;

if (fs.existsSync(testsDir)) {
    const files = fs.readdirSync(testsDir, { recursive: true });
    testCount += files.filter(f => f.toString().includes('.test.')).length;
}

if (fs.existsSync(legacyTestsDir)) {
    const files = fs.readdirSync(legacyTestsDir, { recursive: true });
    testCount += files.filter(f => f.toString().includes('.test.')).length;
}

log.info(`Encontrados ${testCount} archivos de test`);
if (testCount < 10) {
    log.warn('Cobertura de tests baja (<10 archivos)');
    warnings++;
} else {
    log.pass('Cobertura de tests adecuada');
}

// ============================================
// Resumen
// ============================================
console.log('\n' + '='.repeat(50));
console.log('📊 RESUMEN DE VALIDACIÓN');
console.log('='.repeat(50) + '\n');

if (errors === 0 && warnings === 0) {
    log.pass('Proyecto en excelente estado ✨');
} else if (errors === 0) {
    log.warn(`Proyecto OK con ${warnings} advertencia(s)`);
} else {
    log.fail(`Proyecto tiene ${errors} error(es) y ${warnings} advertencia(s)`);
}

console.log('');
process.exit(errors > 0 ? 1 : 0);
