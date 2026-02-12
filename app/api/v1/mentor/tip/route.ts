import { NextRequest, NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/auth/serverAuth';
import { ProactiveMentorAgent } from '@/lib/agents/ProactiveMentorAgent';
import { logger } from '@/lib/observability/Logger';

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
            userId: userId ?? undefined,
            topic,
            difficulty: 'auto',
            language: 'es'
        });

        return NextResponse.json({
            success: true,
            tip: response.content,
            metadata: response.metadata
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error('[MentorAPI] Error generando tip:', error);
        return NextResponse.json({
            error: 'Error generando tip',
            details: message
        }, { status: 500 });
    }
}
