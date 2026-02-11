import { NextRequest, NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/auth/serverAuth';
import { sharedLessonService } from '@/lib/services/community/SharedLessonService';
import logger from '@/lib/logger';

/**
 * POST /api/v1/community/share
 * Comparte una lección específica del sandbox con la comunidad.
 */
export async function POST(req: NextRequest) {
    try {
        const { userId } = await getServerAuth();
        const { lessonId, title, description, category, tags } = await req.json();

        if (!lessonId || !title) {
            return NextResponse.json({ error: 'Faltan parámetros: lessonId y title son obligatorios' }, { status: 400 });
        }

        const sharedId = await sharedLessonService.shareLesson(userId, lessonId, title, description, category, tags);

        return NextResponse.json({
            success: true,
            id: sharedId
        });

    } catch (error: any) {
        logger.error('[CommunityAPI] Error compartiendo lección:', error);
        return NextResponse.json({
            error: 'Error compartiendo lección',
            details: error.message
        }, { status: 500 });
    }
}
