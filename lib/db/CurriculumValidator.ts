/**
 * Curriculum Validator - Guardrails de Calidad de Datos
 * Verifica la integridad estructural y lógica de la base de conocimientos (SQLite).
 */
import { db } from '../db';

export interface ValidationReport {
    timestamp: string;
    passed: boolean;
    checks: {
        jsonIntegrity: { passed: boolean; errors: string[] };
        referentialIntegrity: { passed: boolean; errors: string[] };
        contentCompleteness: { passed: boolean; errors: string[] };
    };
    stats: {
        weeksProcessed: number;
        daysProcessed: number;
    };
}

interface Row {
    id: string;
    [key: string]: unknown;
}

export class CurriculumValidator {
    /**
     * Ejecuta una validación completa del currículo.
     */
    public validateAll(): ValidationReport {
        const report: ValidationReport = {
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

        const weeks = db.query<Row & { semana: number }>('SELECT * FROM semanas ORDER BY semana', []);
        report.stats.weeksProcessed = weeks.length;

        for (const week of weeks) {
            // 1. Validar JSONs de la semana
            this._validateJsonField(week, 'objetivos', report);
            this._validateJsonField(week, 'recursos', report);
            this._validateJsonField(week, 'ejercicios', report);

            // 2. Validar esquema diario
            const days = db.query<Row & { semana_id: string; dia: number; concepto: string }>('SELECT * FROM esquema_diario WHERE semana_id = ?', [week.id]);
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

    private _validateJsonField(row: Row, fieldName: string, report: ValidationReport): void {
        const content = row[fieldName];
        if (!content || typeof content !== 'string') return;

        try {
            const parsed = JSON.parse(content) as unknown;
            if (!parsed || (typeof parsed !== 'object')) {
                this._addError(report, 'jsonIntegrity', `ID ${row.id}: Campo '${fieldName}' no es un objeto/array JSON válido`);
            }
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            this._addError(report, 'jsonIntegrity', `ID ${row.id}: Error parseando JSON en '${fieldName}': ${message}`);
        }
    }

    private _addError(report: ValidationReport, checkCategory: keyof ValidationReport['checks'], message: string): void {
        report.checks[checkCategory].passed = false;
        report.checks[checkCategory].errors.push(message);
    }
}

// Exportar singleton
export const curriculumValidator = new CurriculumValidator();
