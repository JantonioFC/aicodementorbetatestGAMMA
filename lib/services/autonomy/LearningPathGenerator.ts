import { db } from '../../db';
import logger from '../../logger';
import { geminiRouter } from '../../ai/router/GeminiRouter';
import { skillGapService, SkillGap } from './SkillGapService';
import crypto from 'crypto';

export interface PathStep {
    id: string;
    path_id: string;
    step_number: number;
    topic: string;
    estimated_difficulty: string;
    resource_type: 'lesson' | 'exercise' | 'project';
    reasoning: string;
}

export class LearningPathGenerator {
    /**
     * Genera una ruta de aprendizaje personalizada para un usuario basada en sus brechas.
     */
    async generatePath(userId: string, targetProfile: string = 'frontend-starter'): Promise<string> {
        try {
            // 1. Identificar brechas
            const gaps = await skillGapService.analyzeGaps(userId, targetProfile);
            if (gaps.length === 0) {
                logger.info(`[PathGen] No se detectaron brechas para ${userId} en ${targetProfile}.`);
                return 'no-gaps-found';
            }

            // 2. Crear cabecera de la ruta
            const pathId = `path_${crypto.randomUUID()}`;
            db.run(`
                INSERT INTO learning_paths (id, user_id, title, target_profile, status)
                VALUES (?, ?, ?, ?, 'active')
            `, [pathId, userId, `Ruta Personalizada: ${targetProfile}`, targetProfile]);

            // 3. Usar IA para secuenciar las brechas
            await geminiRouter.initialize();
            const prompt = this.buildSequencingPrompt(gaps, targetProfile);

            const response = await geminiRouter.analyze({
                messages: [{ role: 'user', content: prompt }],
                phase: 'planning',
                language: 'es'
            });

            // 4. Parsear y guardar los pasos
            const sequenceData = response.analysis;
            const steps: PathStep[] = sequenceData.steps.map((s: any, index: number) => ({
                id: `step_${crypto.randomUUID()}`,
                path_id: pathId,
                step_number: index + 1,
                topic: s.topic,
                estimated_difficulty: s.difficulty,
                resource_type: s.type || 'lesson',
                reasoning: s.reasoning
            }));

            for (const step of steps) {
                db.run(`
                    INSERT INTO path_steps (id, path_id, step_number, topic, estimated_difficulty, resource_type, reasoning)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [step.id, step.path_id, step.step_number, step.topic, step.estimated_difficulty, step.resource_type, step.reasoning]);
            }

            logger.info(`[PathGen] Ruta ${pathId} generada con ${steps.length} pasos para ${userId}.`);
            return pathId;

        } catch (error: any) {
            logger.error(`[PathGen] Error generando ruta para ${userId}:`, error);
            throw error;
        }
    }

    private buildSequencingPrompt(gaps: SkillGap[], profileName: string): string {
        return `
            Eres un mentor experto en educación técnica.
            Analiza las siguientes brechas de conocimiento detectadas para un estudiante que quiere alcanzar el perfil: "${profileName}".
            
            Brechas detectadas (Topic | Current Level | Target Level):
            ${gaps.map(g => `- ${g.topic} | ${g.current_level} | ${g.target_level}`).join('\n')}
            
            TAREA: Genera una SECUENCIA LÓGICA de aprendizaje paso a paso.
            REGLAS:
            1. Ordena los temas por dependencia pedagógica (ej: JavaScript antes que React).
            2. Para cada paso, proporciona una dificultad estimada (beginner, intermediate, advanced).
            3. Proporciona un razonamiento corto de por qué este paso es necesario en este momento.
            
            RESPONDE ÚNICAMENTE EN FORMATO JSON:
            {
                "steps": [
                    {
                        "topic": "Nombre del tema",
                        "difficulty": "beginner/intermediate/advanced",
                        "type": "lesson/exercise/project",
                        "reasoning": "Explicación breve"
                    }
                ]
            }
        `;
    }

    async getActivePath(userId: string) {
        const path = db.get('SELECT * FROM learning_paths WHERE user_id = ? AND status = "active" ORDER BY created_at DESC LIMIT 1', [userId]) as any;
        if (!path) return null;

        const steps = db.query('SELECT * FROM path_steps WHERE path_id = ? ORDER BY step_number ASC', [path.id]);
        return { ...path, steps };
    }
}

export const learningPathGenerator = new LearningPathGenerator();
