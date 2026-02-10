/**
 * Regression Tester - Detecta degradación en calidad de generación
 * Compara nuevos prompts contra baseline para prevenir regresiones.
 */
import { textMetrics, CombinedMetrics } from './TextMetrics';
import { db } from '../db';

export interface Baseline {
    id: string;
    test_name: string;
    input_context: string;
    expected_output?: string | null;
    expected_topics?: string | null;
    forbidden_terms?: string | null;
    created_at?: string;
}

export interface RegressionResult {
    baselineId: string;
    testName: string;
    passed: boolean;
    metrics: {
        textMetrics: Partial<CombinedMetrics>;
        topicsCoverage: number;
        topicsFound: string[];
        topicsMissing: string[];
        forbiddenFound: string[];
    };
    thresholds: Record<string, number>;
    error?: string;
}

export class RegressionTester {
    private thresholds: Record<string, number>;

    constructor() {
        this._ensureTable();
        this.thresholds = {
            rouge1_f1: 0.5,      // Mínimo aceptable
            rougeL_f1: 0.4,
            bleu: 0.3,
            heuristic: 6.0      // Score mínimo del evaluador
        };
    }

    private _ensureTable(): void {
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
     */
    addBaseline(testCase: { name: string; context: any; expectedOutput?: string; expectedTopics?: string[]; forbiddenTerms?: string[] }): string {
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
     */
    async runTest(baselineId: string, generatedOutput: string): Promise<RegressionResult | { error: string }> {
        const baseline = db.get<Baseline>(
            'SELECT * FROM evaluation_baselines WHERE id = ?',
            [baselineId]
        );

        if (!baseline) {
            return { error: `Baseline ${baselineId} no encontrado` };
        }

        const context = JSON.parse(baseline.input_context);
        const expectedTopics: string[] = JSON.parse(baseline.expected_topics || '[]');
        const forbiddenTerms: string[] = JSON.parse(baseline.forbidden_terms || '[]');

        // 1. Calcular métricas de texto
        let metrics: Partial<CombinedMetrics> = {};
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
        const passed = Boolean(
            (!baseline.expected_output || (metrics.rouge1 && metrics.rouge1.f1 >= this.thresholds.rouge1_f1)) &&
            topicsCoverage >= 0.5 &&
            !hasForbidden
        );

        const result: RegressionResult = {
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
     */
    async runAllTests(generator: (context: any) => Promise<string>): Promise<any> {
        const baselines = db.query<Baseline>('SELECT * FROM evaluation_baselines', []);
        const results: any[] = [];

        for (const baseline of baselines) {
            const context = JSON.parse(baseline.input_context);

            try {
                const generated = await generator(context);
                const result = await this.runTest(baseline.id, generated);
                results.push(result);
            } catch (error: any) {
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
     */
    getHistory(baselineId: string, limit: number = 10): any[] {
        return db.query(`
            SELECT * FROM regression_runs 
            WHERE baseline_id = ? 
            ORDER BY run_at DESC 
            LIMIT ?
        `, [baselineId, limit]);
    }

    /**
     * Detecta regresión comparando últimos N runs.
     */
    detectRegression(baselineId: string): { hasRegression: boolean; reason?: string; failedRuns?: string[] } {
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
export const regressionTester = new RegressionTester();
