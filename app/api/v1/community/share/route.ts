import { NextRequest, NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/auth/serverAuth';
import { sharedLessonService } from '@/lib/services/community/SharedLessonService';
import { logger } from '@/lib/observability/Logger';

/**
 * POST /api/v1/community/share
 * Comparte una lección específica del sandbox con la comunidad.
 */
export async function POST(req: NextRequest) {
    try {
        const { userId } = await getServerAuth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { lessonId, title, description, category, tags } = await req.json();

        if (!lessonId || !title) {
            return NextResponse.json({ error: 'Faltan parámetros: lessonId y title son obligatorios' }, { status: 400 });
        }

        const sharedId = await sharedLessonService.shareLesson(userId, lessonId, title, description, category, tags);

        return NextResponse.json({
            success: true,
            id: sharedId
        });

    } catch (error: unknown) {
        logger.error('[CommunityAPI] Error compartiendo lección:', error);
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({
            error: 'Error compartiendo lección',
            details: message
        }, { status: 500 });
    }
}
