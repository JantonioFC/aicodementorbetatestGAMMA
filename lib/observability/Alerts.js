/**
 * Alerts System - Sistema de alertas por umbral
 * Detecta condiciones anómalas y notifica.
 */
const { metricsCollector } = require('./Metrics');

class AlertsSystem {
    constructor() {
        this.thresholds = {
            errorRate: { warn: 0.05, critical: 0.10 },
            latencyP95: { warn: 3000, critical: 5000 },
            cacheHitRate: { warn: 50, critical: 30 },
            tokenAvg: { warn: 4000, critical: 6000 }
        };

        this.alertHistory = [];
        this.maxAlertHistory = 100;
        this.callbacks = [];
    }

    /**
     * Verifica métricas contra umbrales.
     * @returns {Array} Alertas activas
     */
    check() {
        const metrics = metricsCollector.getMetrics();
        const alerts = [];

        // Error Rate
        if (metrics.errorRate >= this.thresholds.errorRate.critical) {
            alerts.push(this._createAlert('CRITICAL', 'High Error Rate',
                `Error rate ${(metrics.errorRate * 100).toFixed(1)}% exceeds critical threshold`));
        } else if (metrics.errorRate >= this.thresholds.errorRate.warn) {
            alerts.push(this._createAlert('WARNING', 'Elevated Error Rate',
                `Error rate ${(metrics.errorRate * 100).toFixed(1)}% exceeds warning threshold`));
        }

        // Latency
        if (metrics.latency.p95 >= this.thresholds.latencyP95.critical) {
            alerts.push(this._createAlert('CRITICAL', 'High Latency',
                `P95 latency ${metrics.latency.p95}ms exceeds critical threshold`));
        } else if (metrics.latency.p95 >= this.thresholds.latencyP95.warn) {
            alerts.push(this._createAlert('WARNING', 'Elevated Latency',
                `P95 latency ${metrics.latency.p95}ms exceeds warning threshold`));
        }

        // Cache Hit Rate (inverso - alertar cuando es bajo)
        if (metrics.cacheHitRate < this.thresholds.cacheHitRate.critical && metrics.cacheHits + metrics.cacheMisses > 10) {
            alerts.push(this._createAlert('CRITICAL', 'Low Cache Hit Rate',
                `Cache hit rate ${metrics.cacheHitRate}% below critical threshold`));
        } else if (metrics.cacheHitRate < this.thresholds.cacheHitRate.warn && metrics.cacheHits + metrics.cacheMisses > 10) {
            alerts.push(this._createAlert('WARNING', 'Low Cache Hit Rate',
                `Cache hit rate ${metrics.cacheHitRate}% below warning threshold`));
        }

        // Token Usage
        if (metrics.tokens.avg >= this.thresholds.tokenAvg.critical) {
            alerts.push(this._createAlert('CRITICAL', 'High Token Usage',
                `Average token usage ${metrics.tokens.avg} exceeds critical threshold`));
        } else if (metrics.tokens.avg >= this.thresholds.tokenAvg.warn) {
            alerts.push(this._createAlert('WARNING', 'High Token Usage',
                `Average token usage ${metrics.tokens.avg} exceeds warning threshold`));
        }

        // Guardar en historial y notificar
        for (const alert of alerts) {
            this._saveAlert(alert);
            this._notify(alert);
        }

        return alerts;
    }

    /**
     * Crea un objeto de alerta.
     * @private
     */
    _createAlert(level, title, message) {
        return {
            id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            level,
            title,
            message,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Guarda alerta en historial.
     * @private
     */
    _saveAlert(alert) {
        this.alertHistory.push(alert);
        if (this.alertHistory.length > this.maxAlertHistory) {
            this.alertHistory.shift();
        }
    }

    /**
     * Notifica a callbacks registrados.
     * @private
     */
    _notify(alert) {
        console.log(`[ALERT ${alert.level}] ${alert.title}: ${alert.message}`);

        for (const callback of this.callbacks) {
            try {
                callback(alert);
            } catch (e) {
                console.error('[Alerts] Callback error:', e.message);
            }
        }
    }

    /**
     * Registra un callback para notificaciones.
     * @param {Function} callback 
     */
    onAlert(callback) {
        this.callbacks.push(callback);
    }

    /**
     * Actualiza umbrales.
     * @param {Object} newThresholds 
     */
    setThresholds(newThresholds) {
        this.thresholds = { ...this.thresholds, ...newThresholds };
    }

    /**
     * Obtiene historial de alertas.
     * @param {Object} options - { level, limit }
     * @returns {Array}
     */
    getHistory(options = {}) {
        let alerts = [...this.alertHistory];

        if (options.level) {
            alerts = alerts.filter(a => a.level === options.level);
        }

        return alerts.slice(-(options.limit || 50)).reverse();
    }

    /**
     * Obtiene resumen de alertas.
     * @returns {Object}
     */
    getSummary() {
        const last24h = Date.now() - (24 * 60 * 60 * 1000);
        const recent = this.alertHistory.filter(a =>
            new Date(a.timestamp).getTime() > last24h
        );

        return {
            total: this.alertHistory.length,
            last24h: {
                total: recent.length,
                critical: recent.filter(a => a.level === 'CRITICAL').length,
                warning: recent.filter(a => a.level === 'WARNING').length
            }
        };
    }
}

// Exportar singleton
const alertsSystem = new AlertsSystem();
module.exports = { alertsSystem, AlertsSystem };
