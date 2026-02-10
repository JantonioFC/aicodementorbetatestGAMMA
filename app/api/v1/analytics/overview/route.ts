import { NextResponse } from 'next/server';
import { analyticsService } from '@/lib/services/AnalyticsService';

export async function GET() {
    try {
        const overview = analyticsService.getOverview();
        const evaluationMetrics = analyticsService.getEvaluationMetrics();

        return NextResponse.json({
            success: true,
            data: {
                overview,
                evaluationMetrics
            },
            generatedAt: new Date().toISOString()
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
