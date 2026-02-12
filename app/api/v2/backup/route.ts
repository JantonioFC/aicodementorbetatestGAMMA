import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/observability/Logger';

export async function GET() {
    try {
        const usageReport = await logger.getDailyReport();
        const recentSuccessLogs = await logger.getRecentLogs('success.log', 20);
        const recentErrorLogs = await logger.getRecentLogs('errors.log', 10);

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            usage: usageReport,
            logs: {
                success: recentSuccessLogs,
                errors: recentErrorLogs
            }
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

export async function POST() {
    try {
        const successLogs = await logger.getRecentLogs('success.log', 1000);
        const errorLogs = await logger.getRecentLogs('errors.log', 1000);

        return NextResponse.json({
            success: true,
            backup: {
                version: '1.0.0',
                type: 'server-logs',
                createdAt: new Date().toISOString(),
                data: { successLogs, errorLogs }
            }
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
