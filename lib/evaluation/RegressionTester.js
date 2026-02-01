/**
 * Regression Tester - Detecta degradación en calidad de generación
 * Compara nuevos prompts contra baseline para prevenir regresiones.
 */
const { textMetrics } = require('./TextMetrics');
const { lessonEvaluator } = require('./LessonEvaluator');
const db = require('../db');

class RegressionTester {
    constructor() {
        this._ensureTable();
        this.thresholds = {
            rouge1_f1: 0.5,      // Mínimo aceptable
            rougeL_f1: 0.4,
            bleu: 0.3,
            heuristic: 6.0      // Score mínimo del evaluador
        };
    }

    _ensureTable() {
        db.exec(`
            CREATE TABLE IF NOT EXISTS evaluation_baselines (
                id TEXT PRIMARY KEY,
                test_name TEXT NOT NULL,
                input_context TEXT NOT NULL,
                expected_output TEXT,
                expected_topics TEXT,
                forbidden_terms TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(test_name)
            );

            CREATE TABLE IF NOT EXISTS regression_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                baseline_id TEXT NOT NULL,
                generated_output TEXT,
                metrics TEXT,
                passed INTEGER,
                run_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (baseline_id) REFERENCES evaluation_baselines(id)
            );
        `);
    }

    /**
     * Añade un caso de prueba al baseline.
     * @param {Object} testCase - { name, context, expectedOutput, expectedTopics, forbiddenTerms }
     */
    addBaseline(testCase) {
        const id = `baseline-${Date.now()}`;

        db.run(`
            INSERT OR REPLACE INTO evaluation_baselines 
            (id, test_name, input_context, expected_output, expected_topics, forbidden_terms)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            id,
            testCase.name,
            JSON.stringify(testCase.context),
            testCase.expectedOutput || null,
            JSON.stringify(testCase.expectedTopics || []),
            JSON.stringify(testCase.forbiddenTerms || [])
        ]);

        return id;
    }

    /**
     * Ejecuta test de regresión contra un baseline.
     * @param {string} baselineId 
     * @param {string} generatedOutput 
     * @returns {Object} Resultado del test
     */
    async runTest(baselineId, generatedOutput) {
        const baseline = db.get(
            'SELECT * FROM evaluation_baselines WHERE id = ?',
            [baselineId]
        );

        if (!baseline) {
            return { error: `Baseline ${baselineId} no encontrado` };
        }

        const context = JSON.parse(baseline.input_context);
        const expectedTopics = JSON.parse(baseline.expected_topics || '[]');
        const forbiddenTerms = JSON.parse(baseline.forbidden_terms || '[]');

        // 1. Calcular métricas de texto
        let metrics = {};
        if (baseline.expected_output) {
            metrics = textMetrics.calculateAll(generatedOutput, baseline.expected_output);
        }

        // 2. Verificar temas esperados
        const lowerOutput = generatedOutput.toLowerCase();
        const topicsFound = expectedTopics.filter(t => lowerOutput.includes(t.toLowerCase()));
        const topicsCoverage = expectedTopics.length > 0
            ? topicsFound.length / expectedTopics.length
            : 1;

        // 3. Verificar términos prohibidos
        const forbiddenFound = forbiddenTerms.filter(t => lowerOutput.includes(t.toLowerCase()));
        const hasForbidden = forbiddenFound.length > 0;

        // 4. Determinar si pasa
        const passed =
            (!baseline.expected_output || metrics.rouge1?.f1 >= this.thresholds.rouge1_f1) &&
            topicsCoverage >= 0.5 &&
            !hasForbidden;

        const result = {
            baselineId,
            testName: baseline.test_name,
            passed,
            metrics: {
                textMetrics: metrics,
                topicsCoverage: Math.round(topicsCoverage * 100) / 100,
                topicsFound,
                topicsMissing: expectedTopics.filter(t => !topicsFound.includes(t)),
                forbiddenFound
            },
            thresholds: this.thresholds
        };

        // 5. Guardar resultado
        db.run(`
            INSERT INTO regression_runs (baseline_id, generated_output, metrics, passed)
            VALUES (?, ?, ?, ?)
        `, [
            baselineId,
            generatedOutput.substring(0, 5000),
            JSON.stringify(result.metrics),
            passed ? 1 : 0
        ]);

        return result;
    }

    /**
     * Ejecuta todos los tests de regresión.
     * @param {Function} generator - Función async que genera output dado un contexto
     * @returns {Promise<Object>}
     */
    async runAllTests(generator) {
        const baselines = db.query('SELECT * FROM evaluation_baselines', []);
        const results = [];

        for (const baseline of baselines) {
            const context = JSON.parse(baseline.input_context);

            try {
                const generated = await generator(context);
                const result = await this.runTest(baseline.id, generated);
                results.push(result);
            } catch (error) {
                results.push({
                    baselineId: baseline.id,
                    testName: baseline.test_name,
                    passed: false,
                    error: error.message
                });
            }
        }

        const summary = {
            total: results.length,
            passed: results.filter(r => r.passed).length,
            failed: results.filter(r => !r.passed).length,
            passRate: results.length > 0
                ? Math.round((results.filter(r => r.passed).length / results.length) * 100)
                : 0,
            results
        };

        return summary;
    }

    /**
     * Obtiene historial de un baseline.
     * @param {string} baselineId 
     * @param {number} limit 
     * @returns {Array}
     */
    getHistory(baselineId, limit = 10) {
        return db.query(`
            SELECT * FROM regression_runs 
            WHERE baseline_id = ? 
            ORDER BY run_at DESC 
            LIMIT ?
        `, [baselineId, limit]);
    }

    /**
     * Detecta regresión comparando últimos N runs.
     * @param {string} baselineId 
     * @returns {Object}
     */
    detectRegression(baselineId) {
        const history = this.getHistory(baselineId, 5);

        if (history.length < 2) {
            return { hasRegression: false, reason: 'Insufficient history' };
        }

        const recentPassed = history.slice(0, 2).every(r => r.passed);
        const previousPassed = history.slice(2).some(r => r.passed);

        if (!recentPassed && previousPassed) {
            return {
                hasRegression: true,
                reason: 'Recent runs failing after previous success',
                failedRuns: history.slice(0, 2).map(r => r.run_at)
            };
        }

        return { hasRegression: false };
    }
}

// Exportar singleton
const regressionTester = new RegressionTester();
module.exports = { regressionTester, RegressionTester };
