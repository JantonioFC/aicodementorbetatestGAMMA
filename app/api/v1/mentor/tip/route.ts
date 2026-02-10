import { NextRequest, NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/auth/serverAuth';
import { ProactiveMentorAgent } from '@/lib/agents/ProactiveMentorAgent';
import logger from '@/lib/logger';

const mentorAgent = new ProactiveMentorAgent();

/**
 * GET /api/v1/mentor/tip
 * Retorna un consejo proactivo basado en el perfil del usuario.
 */
export async function GET(req: NextRequest) {
    try {
        const { userId } = await getServerAuth();
        const { searchParams } = new URL(req.url);
        const topic = searchParams.get('topic') || 'Programación General';

        logger.info(`[MentorAPI] Solicitando tip para ${userId} sobre ${topic}`);

        const response = await mentorAgent.process('', {
            userId,
            topic,
            difficulty: 'auto',
            language: 'es'
        });

        return NextResponse.json({
            success: true,
            tip: response.content,
            metadata: response.metadata
        });

    } catch (error: any) {
        logger.error('[MentorAPI] Error generando tip:', error);
        return NextResponse.json({
            error: 'Error generando tip',
            details: error.message
        }, { status: 500 });
    }
}
