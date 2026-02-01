/**
 * Curriculum Validator - Guardrails de Calidad de Datos
 * Verifica la integridad estructural y lógica de la base de conocimientos (SQLite).
 */
const db = require('../db');

class CurriculumValidator {
    /**
     * Ejecuta una validación completa del currículo.
     * @returns {Object} Reporte de validación
     */
    validateAll() {
        const report = {
            timestamp: new Date().toISOString(),
            passed: true,
            checks: {
                jsonIntegrity: { passed: true, errors: [] },
                referentialIntegrity: { passed: true, errors: [] },
                contentCompleteness: { passed: true, errors: [] }
            },
            stats: {
                weeksProcessed: 0,
                daysProcessed: 0
            }
        };

        const weeks = db.query('SELECT * FROM semanas ORDER BY semana');
        report.stats.weeksProcessed = weeks.length;

        for (const week of weeks) {
            // 1. Validar JSONs de la semana
            this._validateJsonField(week, 'objetivos', report);
            this._validateJsonField(week, 'recursos', report);
            this._validateJsonField(week, 'ejercicios', report);

            // 2. Validar esquema diario
            const days = db.query('SELECT * FROM esquema_diario WHERE semana_id = ?', [week.id]);
            report.stats.daysProcessed += days.length;

            if (days.length === 0) {
                this._addError(report, 'contentCompleteness', `Semana ${week.semana} no tiene días asignados`);
            }

            for (const day of days) {
                this._validateJsonField(day, 'pomodoros', report);

                // Validar que tenga concepto
                if (!day.concepto || day.concepto.length < 3) {
                    this._addError(report, 'contentCompleteness', `Semana ${week.semana}, Día ${day.dia}: Concepto vacío o muy corto`);
                }
            }
        }

        // Determinar estado final
        report.passed = report.checks.jsonIntegrity.passed &&
            report.checks.referentialIntegrity.passed &&
            report.checks.contentCompleteness.passed;

        return report;
    }

    _validateJsonField(row, fieldName, report) {
        const content = row[fieldName];
        if (!content) return; // Campos vacíos permitidos si no son obligatorios

        try {
            const parsed = JSON.parse(content);
            if (!Array.isArray(parsed) && typeof parsed !== 'object') {
                this._addError(report, 'jsonIntegrity', `ID ${row.id}: Campo '${fieldName}' no es un objeto/array JSON válido`);
            }
            if (Array.isArray(parsed) && parsed.length === 0) {
                // Warning opcional: array vacío
            }
        } catch (e) {
            this._addError(report, 'jsonIntegrity', `ID ${row.id}: Error parseando JSON en '${fieldName}': ${e.message}`);
        }
    }

    _addError(report, checkCategory, message) {
        report.checks[checkCategory].passed = false;
        report.checks[checkCategory].errors.push(message);
    }
}

// Exportar singleton
const curriculumValidator = new CurriculumValidator();
module.exports = { curriculumValidator, CurriculumValidator };
