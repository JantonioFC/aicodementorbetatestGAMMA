import { NextRequest, NextResponse } from 'next/server';
import { analyticsService } from '@/lib/services/AnalyticsService';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const days = parseInt(searchParams.get('days') || '30');

        const lessonsPerDay = analyticsService.getLessonsPerDay(days);
        const scoreDistribution = analyticsService.getScoreDistribution();
        const activityByWeek = analyticsService.getActivityByWeek();

        return NextResponse.json({
            success: true,
            data: {
                lessonsPerDay,
                scoreDistribution,
                activityByWeek
            },
            params: { days }
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
