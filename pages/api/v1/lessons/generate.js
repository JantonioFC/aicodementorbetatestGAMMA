import { withOptionalAuth } from '../../../../utils/authMiddleware';
import { lessonService } from '../../../../lib/services/LessonService';
import { logger } from '../../../../lib/utils/logger';
import { validate } from '../../../../lib/middleware/validate';

/**
 * @api {post} /api/v1/lessons/generate Generar Lección
 * @description Genera una lección educativa basada en el contexto del currículo.
 * 
 * @body {number} semanaId - ID de la semana
 * @body {number} dia|diaIndex - Día (1-5) o índice (0-4)
 * @body {number} pomodoroIndex - Índice del pomodoro
 * @body {boolean} includeMultimodal - Incluir diagramas (opcional)
 * @body {boolean} useStorytellingPrompt - Usar prompts con storytelling y CoT (default: true)
 * @body {boolean} useLLMJudge - Usar LLM-as-Judge para evaluación (default: false)
 * 
 * @header X-User-Id - ID del usuario (opcional)
 */
async function handler(req, res) {
    try {
        const {
            semanaId,
            dia,
            diaIndex,
            pomodoroIndex,
            includeMultimodal,
            useStorytellingPrompt = true,
            useLLMJudge = false
        } = req.body;

        // Normalizar día (soporta 'dia' directo o 'diaIndex')
        const diaFinal = dia || (diaIndex !== undefined ? diaIndex + 1 : null);

        // Extraer userId del contexto de auth o header
        const userId = req.authContext?.userId || req.headers['x-user-id'] || null;

        logger.info(`[API v1] Generando lección para S${semanaId}/D${diaFinal}/P${pomodoroIndex}`, {
            userId,
            includeMultimodal: !!includeMultimodal,
            useStorytellingPrompt,
            useLLMJudge
        });

        // Delegar al servicio
        const result = await lessonService.generateLesson({
            semanaId: Number(semanaId),
            dia: Number(diaFinal),
            pomodoroIndex: Number(pomodoroIndex),
            userId,
            enrichWithMultimodal: !!includeMultimodal,
            useStorytellingPrompt,
            useLLMJudge
        });

        return res.status(200).json(result);

    } catch (error) {
        logger.error('[API v1] Error generando lección', error);
        return res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message
        });
    }
}

// Esquema de validación
const schema = {
    method: 'POST',
    required: ['semanaId', 'pomodoroIndex'],
    types: {
        semanaId: 'number',
        pomodoroIndex: 'number'
    }
};

export default withOptionalAuth(validate(schema, handler));
