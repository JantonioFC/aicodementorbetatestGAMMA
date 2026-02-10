/**
 * Metrics Collector - Recolecta métricas del sistema
 * Expone métricas para dashboards y alertas.
 */

export interface Metrics {
    lessonsGenerated: number;
    lessonsErrors: number;
    quizResponses: number;
    cacheHits: number;
    cacheMisses: number;
    embeddingSearches: number;
    activeUsers: number;
    activeSessions: number;
    latencies: number[];
    tokenUsage: number[];
    [key: string]: number | number[];
}

export interface CalculatedMetrics {
    uptime: number;
    uptimeHuman: string;
    lessonsGenerated: number;
    lessonsErrors: number;
    errorRate: number;
    quizResponses: number;
    cacheHits: number;
    cacheMisses: number;
    cacheHitRate: number;
    latency: {
        p50: number;
        p95: number;
        p99: number;
        avg: number;
    };
    tokens: {
        total: number;
        avg: number;
    };
    activeUsers: number;
    activeSessions: number;
    embeddingSearches: number;
}

export class MetricsCollector {
    private metrics: Metrics;
    private startTime: number;
    private lastReset: number;

    constructor() {
        this.metrics = {
            // Contadores
            lessonsGenerated: 0,
            lessonsErrors: 0,
            quizResponses: 0,
            cacheHits: 0,
            cacheMisses: 0,
            embeddingSearches: 0,

            // Gauges (valores actuales)
            activeUsers: 0,
            activeSessions: 0,

            // Histogramas (distribuciones)
            latencies: [],
            tokenUsage: []
        };

        this.startTime = Date.now();
        this.lastReset = Date.now();
    }

    /**
     * Incrementa un contador.
     */
    increment(name: keyof Metrics, value: number = 1): void {
        const current = this.metrics[name];
        if (typeof current === 'number') {
            this.metrics[name] = current + value;
        }
    }

    /**
     * Establece un gauge.
     */
    set(name: keyof Metrics, value: number): void {
        this.metrics[name] = value;
    }

    /**
     * Registra un valor de latencia.
     */
    recordLatency(ms: number): void {
        this.metrics.latencies.push(ms);
        // Mantener últimas 1000 mediciones
        if (this.metrics.latencies.length > 1000) {
            this.metrics.latencies.shift();
        }
    }

    /**
     * Registra uso de tokens.
     */
    recordTokens(tokens: number): void {
        this.metrics.tokenUsage.push(tokens);
        if (this.metrics.tokenUsage.length > 1000) {
            this.metrics.tokenUsage.shift();
        }
    }

    /**
     * Calcula percentil de un array.
     */
    private _percentile(arr: number[], p: number): number {
        if (arr.length === 0) return 0;
        const sorted = [...arr].sort((a, b) => a - b);
        const idx = Math.ceil(p / 100 * sorted.length) - 1;
        return sorted[Math.max(0, idx)];
    }

    /**
     * Obtiene todas las métricas calculadas.
     */
    getMetrics(): CalculatedMetrics {
        const uptime = Date.now() - this.startTime;
        const latencies = this.metrics.latencies as number[];
        const tokens = this.metrics.tokenUsage as number[];

        return {
            // Info del sistema
            uptime: Math.round(uptime / 1000),
            uptimeHuman: `${Math.floor(uptime / 3600000)}h ${Math.floor((uptime % 3600000) / 60000)}m`,

            // Contadores
            lessonsGenerated: this.metrics.lessonsGenerated as number,
            lessonsErrors: this.metrics.lessonsErrors as number,
            errorRate: (this.metrics.lessonsGenerated as number) > 0
                ? Math.round(((this.metrics.lessonsErrors as number) / (this.metrics.lessonsGenerated as number)) * 100) / 100
                : 0,

            quizResponses: this.metrics.quizResponses as number,

            // Cache
            cacheHits: this.metrics.cacheHits as number,
            cacheMisses: this.metrics.cacheMisses as number,
            cacheHitRate: ((this.metrics.cacheHits as number) + (this.metrics.cacheMisses as number)) > 0
                ? Math.round(((this.metrics.cacheHits as number) / ((this.metrics.cacheHits as number) + (this.metrics.cacheMisses as number))) * 100)
                : 0,

            // Latencia
            latency: {
                p50: this._percentile(latencies, 50),
                p95: this._percentile(latencies, 95),
                p99: this._percentile(latencies, 99),
                avg: latencies.length > 0
                    ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
                    : 0
            },

            // Tokens
            tokens: {
                total: tokens.reduce((a, b) => a + b, 0),
                avg: tokens.length > 0
                    ? Math.round(tokens.reduce((a, b) => a + b, 0) / tokens.length)
                    : 0
            },

            // Gauges
            activeUsers: this.metrics.activeUsers as number,
            activeSessions: this.metrics.activeSessions as number,
            embeddingSearches: this.metrics.embeddingSearches as number
        };
    }

    /**
     * Formatea métricas en formato Prometheus.
     */
    toPrometheus(): string {
        const m = this.getMetrics();
        return [
            `# HELP ai_mentor_uptime_seconds Server uptime in seconds`,
            `# TYPE ai_mentor_uptime_seconds gauge`,
            `ai_mentor_uptime_seconds ${m.uptime}`,
            ``,
            `# HELP ai_mentor_lessons_total Total lessons generated`,
            `# TYPE ai_mentor_lessons_total counter`,
            `ai_mentor_lessons_total ${m.lessonsGenerated}`,
            ``,
            `# HELP ai_mentor_lessons_errors_total Total lesson errors`,
            `# TYPE ai_mentor_lessons_errors_total counter`,
            `ai_mentor_lessons_errors_total ${m.lessonsErrors}`,
            ``,
            `# HELP ai_mentor_cache_hit_rate Cache hit rate percentage`,
            `# TYPE ai_mentor_cache_hit_rate gauge`,
            `ai_mentor_cache_hit_rate ${m.cacheHitRate}`,
            ``,
            `# HELP ai_mentor_latency_ms Request latency in milliseconds`,
            `# TYPE ai_mentor_latency_ms summary`,
            `ai_mentor_latency_ms{quantile="0.5"} ${m.latency.p50}`,
            `ai_mentor_latency_ms{quantile="0.95"} ${m.latency.p95}`,
            `ai_mentor_latency_ms{quantile="0.99"} ${m.latency.p99}`,
        ].join('\n');
    }

    /**
     * Reinicia contadores (pero no histogramas).
     */
    reset(): void {
        this.metrics.lessonsGenerated = 0;
        this.metrics.lessonsErrors = 0;
        this.metrics.quizResponses = 0;
        this.metrics.cacheHits = 0;
        this.metrics.cacheMisses = 0;
        this.lastReset = Date.now();
    }
}

// Exportar singleton
export const metricsCollector = new MetricsCollector();
