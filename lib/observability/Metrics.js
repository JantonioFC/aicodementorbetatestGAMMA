/**
 * Metrics Collector - Recolecta métricas del sistema
 * Expone métricas para dashboards y alertas.
 */

class MetricsCollector {
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
     * @param {string} name 
     * @param {number} value 
     */
    increment(name, value = 1) {
        if (typeof this.metrics[name] === 'number') {
            this.metrics[name] += value;
        }
    }

    /**
     * Establece un gauge.
     * @param {string} name 
     * @param {number} value 
     */
    set(name, value) {
        this.metrics[name] = value;
    }

    /**
     * Registra un valor de latencia.
     * @param {number} ms 
     */
    recordLatency(ms) {
        this.metrics.latencies.push(ms);
        // Mantener últimas 1000 mediciones
        if (this.metrics.latencies.length > 1000) {
            this.metrics.latencies.shift();
        }
    }

    /**
     * Registra uso de tokens.
     * @param {number} tokens 
     */
    recordTokens(tokens) {
        this.metrics.tokenUsage.push(tokens);
        if (this.metrics.tokenUsage.length > 1000) {
            this.metrics.tokenUsage.shift();
        }
    }

    /**
     * Calcula percentil de un array.
     * @private
     */
    _percentile(arr, p) {
        if (arr.length === 0) return 0;
        const sorted = [...arr].sort((a, b) => a - b);
        const idx = Math.ceil(p / 100 * sorted.length) - 1;
        return sorted[Math.max(0, idx)];
    }

    /**
     * Obtiene todas las métricas calculadas.
     * @returns {Object}
     */
    getMetrics() {
        const uptime = Date.now() - this.startTime;
        const latencies = this.metrics.latencies;
        const tokens = this.metrics.tokenUsage;

        return {
            // Info del sistema
            uptime: Math.round(uptime / 1000),
            uptimeHuman: `${Math.floor(uptime / 3600000)}h ${Math.floor((uptime % 3600000) / 60000)}m`,

            // Contadores
            lessonsGenerated: this.metrics.lessonsGenerated,
            lessonsErrors: this.metrics.lessonsErrors,
            errorRate: this.metrics.lessonsGenerated > 0
                ? Math.round((this.metrics.lessonsErrors / this.metrics.lessonsGenerated) * 100) / 100
                : 0,

            quizResponses: this.metrics.quizResponses,

            // Cache
            cacheHits: this.metrics.cacheHits,
            cacheMisses: this.metrics.cacheMisses,
            cacheHitRate: (this.metrics.cacheHits + this.metrics.cacheMisses) > 0
                ? Math.round((this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100)
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
            activeUsers: this.metrics.activeUsers,
            activeSessions: this.metrics.activeSessions,
            embeddingSearches: this.metrics.embeddingSearches
        };
    }

    /**
     * Formatea métricas en formato Prometheus.
     * @returns {string}
     */
    toPrometheus() {
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
    reset() {
        this.metrics.lessonsGenerated = 0;
        this.metrics.lessonsErrors = 0;
        this.metrics.quizResponses = 0;
        this.metrics.cacheHits = 0;
        this.metrics.cacheMisses = 0;
        this.lastReset = Date.now();
    }
}

// Exportar singleton
const metricsCollector = new MetricsCollector();
module.exports = { metricsCollector, MetricsCollector };
