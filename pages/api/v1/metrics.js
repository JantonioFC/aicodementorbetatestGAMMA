/**
 * @api {get} /api/v1/metrics System Metrics
 * @description Exposes system metrics for monitoring (Prometheus compatible).
 */
import { metricsCollector } from '../../../lib/observability/Metrics';
import { alertsSystem } from '../../../lib/observability/Alerts';
import { tracer } from '../../../lib/observability/Tracer';

export default async function handler(req, res) {
    // Check for Prometheus format
    const accept = req.headers.accept || '';
    const format = req.query.format || (accept.includes('text/plain') ? 'prometheus' : 'json');

    if (format === 'prometheus') {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.status(200).send(metricsCollector.toPrometheus());
    }

    // JSON format (default)
    const metrics = metricsCollector.getMetrics();
    const alerts = alertsSystem.check();
    const tracerStats = tracer.getStats();

    return res.status(200).json({
        success: true,
        timestamp: new Date().toISOString(),
        metrics,
        alerts: {
            active: alerts,
            summary: alertsSystem.getSummary()
        },
        tracing: {
            activeSpans: tracer.activeSpans.size,
            stats: tracerStats
        }
    });
}
