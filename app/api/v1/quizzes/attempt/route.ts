import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerAuth } from '@/lib/auth/serverAuth';
import { competencyService } from '@/lib/services/CompetencyService';
import { badgeService } from '@/lib/services/gamification/BadgeService';
import { logger } from '@/lib/observability/Logger';

/**
 * POST /api/v1/quizzes/attempt
 * Registra un intento de respuesta en un quiz y otorga competencias si es correcto.
 */
export async function POST(req: NextRequest) {
    try {
        const { userId } = await getServerAuth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();

        const {
            lessonId,
            questionIndex,
            userAnswer,
            correctAnswer,
            isCorrect,
            topic // Opcional, nombre de la competencia
        } = body;

        if (!lessonId || questionIndex === undefined || userAnswer === undefined) {
            return NextResponse.json({ error: 'Faltan parámetros obligatorios' }, { status: 400 });
        }

        const attemptId = `qa_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

        // 1. Guardar Intento en DB
        db.insert('quiz_attempts', {
            id: attemptId,
            user_id: userId,
            lesson_id: lessonId,
            question_index: questionIndex,
            user_answer: String(userAnswer),
            correct_answer: String(correctAnswer),
            is_correct: isCorrect ? 1 : 0,
            created_at: new Date().toISOString()
        });

        // 2. Si es correcto, registrar competencia automática
        if (isCorrect) {
            logger.info(`[QuizAPI] Respuesta correcta para ${userId} en lección ${lessonId}. Registrando competencia.`);

            // Intentar obtener el tema de la lección si no se pasó
            let competencyName = topic;
            if (!competencyName) {
                const lesson = db.get('SELECT title FROM sandbox_generations WHERE id = ?', [lessonId]) as Record<string, unknown> | undefined;
                competencyName = lesson?.title || 'Conocimiento General';
            }

            await competencyService.logCompetency(userId, {
                competency_name: competencyName,
                competency_category: 'Conceptos Teóricos',
                level_achieved: 1, // Por ahora fijo, podría escalar en el futuro
                evidence_description: `Respuesta correcta en quiz de la lección: ${competencyName}`
            });

            // 3. Chequeo automático de logros (Fase 12)
            await badgeService.checkAndAwardBadges(userId);
        }

        return NextResponse.json({
            success: true,
            attemptId,
            message: isCorrect ? '¡Competencia registrada!' : 'Intento registrado'
        });

    } catch (error: unknown) {
        logger.error('[QuizAPI] Error procesando intento', error);
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
