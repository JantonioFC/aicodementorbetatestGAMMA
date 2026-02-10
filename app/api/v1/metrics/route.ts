import { NextRequest, NextResponse } from 'next/server';
import { metricsCollector } from '@/lib/observability/Metrics';
import { alertsSystem } from '@/lib/observability/Alerts';
import { tracer } from '@/lib/observability/Tracer';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const accept = req.headers.get('accept') || '';
    const format = searchParams.get('format') || (accept.includes('text/plain') ? 'prometheus' : 'json');

    if (format === 'prometheus') {
        return new Response(metricsCollector.toPrometheus(), {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }

    const metrics = metricsCollector.getMetrics();
    const alerts = alertsSystem.check();
    const tracerStats = tracer.getStats();

    return NextResponse.json({
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
