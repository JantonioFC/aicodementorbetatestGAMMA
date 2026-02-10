import { NextRequest, NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/auth/serverAuth';
import { smartLessonGenerator } from '@/lib/services/SmartLessonGenerator';
import { db } from '@/lib/db';
import crypto from 'crypto';
import logger from '@/lib/logger';

/**
 * POST /api/sandbox/generate
 * Genera una lección personalizada usando el motor agentic y la guarda en el historial.
 */
export async function POST(req: NextRequest) {
    try {
        const { userId } = await getServerAuth();
        const { customContent, domain, topic } = await req.json();

        if (!customContent) {
            return NextResponse.json({ error: 'Contenido requerido' }, { status: 400 });
        }

        logger.info(`[SandboxAPI] Iniciando generación para usuario ${userId} (Dominio: ${domain})`);

        // 1. Generar lección usando el orquestador de agentes
        const lesson = await smartLessonGenerator.generateWithAutonomy({
            topic: topic || customContent.split('\n')[0].substring(0, 50),
            difficulty: 'auto',
            userId,
            language: 'es',
            context: {
                tematica_semanal: domain || 'General',
                concepto_del_dia: topic || 'Personalizado',
                texto_del_pomodoro: customContent
            }
        });

        // 2. Persistir en sandbox_generations para tener un lessonId real
        const id = crypto.randomUUID();
        const title = lesson.title || customContent.split(/\s+/).slice(0, 7).join(' ').substring(0, 100);

        db.insert('sandbox_generations', {
            id,
            user_id: userId,
            custom_content: customContent,
            title,
            generated_lesson: JSON.stringify(lesson),
            metadata: JSON.stringify({
                domain,
                generatedAt: new Date().toISOString(),
                agentic: true
            }),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

        // 3. Devolver lección con el ID de la base de datos
        return NextResponse.json({
            success: true,
            id, // Importante para el componente Quiz
            title,
            lesson: lesson.content,
            exercises: lesson.exercises || [],
            sandboxMetadata: {
                domain,
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error: any) {
        logger.error('[SandboxAPI] Error en generación sandbox:', error);
        return NextResponse.json({
            error: 'Error generando lección',
            details: error.message
        }, { status: 500 });
    }
}
