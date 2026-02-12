import { NextResponse } from 'next/server';
import { geminiRouter } from '@/lib/ai/router/GeminiRouter';
import { logger } from '@/lib/observability/Logger';

export async function GET() {
    try {
        const availableModels = await geminiRouter.initialize();
        const routerStats = geminiRouter.getStats();
        const usageReport = await logger.getDailyReport();

        return NextResponse.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            router: { initialized: true, ...routerStats },
            models: {
                available: availableModels.length,
                list: availableModels.map((m) => ({
                    name: m.name,
                    displayName: m.displayName,
                    priority: m.priority
                }))
            },
            usage: usageReport,
            geminiApiConfigured: !!process.env.GEMINI_API_KEY
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({
            status: 'unhealthy',
            error: message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
