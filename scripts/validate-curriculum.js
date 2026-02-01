/**
 * Script de Validación de Currículo
 * Ejecuta el CurriculumValidator y reporta resultados en consola.
 */
const { curriculumValidator } = require('../lib/db/CurriculumValidator');

console.log('🔍 Iniciando validación de currículo...\n');

try {
    const report = curriculumValidator.validateAll();

    // Resumen
    console.log(`📊 Semanas procesadas: ${report.stats.weeksProcessed}`);
    console.log(`📊 Días procesados: ${report.stats.daysProcessed}`);
    console.log('-----------------------------------');

    if (report.passed) {
        console.log('✅ VALIDACIÓN EXITOSA: No se encontraron errores críticos.');
    } else {
        console.log('❌ VALIDACIÓN FALLIDA: Se encontraron errores.\n');

        if (!report.checks.jsonIntegrity.passed) {
            console.log('🛑 Errores de Integridad JSON:');
            report.checks.jsonIntegrity.errors.forEach(e => console.log(`   - ${e}`));
        }

        if (!report.checks.contentCompleteness.passed) {
            console.log('🛑 Errores de Completitud:');
            report.checks.contentCompleteness.errors.forEach(e => console.log(`   - ${e}`));
        }

        process.exit(1);
    }

} catch (error) {
    console.error('💥 Error fatal durante validación:', error);
    process.exit(1);
}
