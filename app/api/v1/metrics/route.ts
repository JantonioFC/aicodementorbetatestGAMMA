import { NextRequest, NextResponse } from 'next/server';
import { metricsCollector } from '@/lib/observability/Metrics';
import { alertsSystem } from '@/lib/observability/Alerts';
import { tracer } from '@/lib/observability/Tracer';

import { getServerAuth } from '@/lib/auth/serverAuth';

export async function GET(req: NextRequest) {
    // 1. Check API Key for monitoring tools (Prometheus/Grafana)
    const authHeader = req.headers.get('authorization');
    const apiKey = req.headers.get('x-api-key') || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);
    const validApiKey = process.env.METRICS_API_KEY;

    let isAuthenticated = false;

    if (validApiKey && apiKey === validApiKey) {
        isAuthenticated = true;
    } else {
        // 2. Check user session for admin access
        const session = await getServerAuth();
        if (session.isAuthenticated) {
            isAuthenticated = true;
        }
    }

    if (!isAuthenticated) {
        return NextResponse.json(
            { error: 'Unauthorized - Invalid credentials' },
            { status: 401 }
        );
    }

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
