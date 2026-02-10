import { db } from '../db';
import logger from '../logger';

export interface CompetencyEntry {
    id: string;
    user_id: string;
    competency_name: string;
    competency_category: string;
    level_achieved: number;
    evidence_description: string;
    achieved_date: string;
}

export interface CompetencyProfile {
    userId: string;
    competencies: Record<string, {
        level: number;
        evidenceCount: number;
        lastAchieved: string;
    }>;
}

/**
 * Competency Service - Gestiona el registro y análisis de habilidades adquiridas
 */
export class CompetencyService {
    /**
     * Registrar una nueva competencia o actualizar nivel
     */
    async logCompetency(userId: string, data: Partial<CompetencyEntry>): Promise<string> {
        try {
            const id = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            const entry = {
                id,
                user_id: userId,
                competency_name: data.competency_name || 'Habilidad Desconocida',
                competency_category: data.competency_category || 'General',
                level_achieved: data.level_achieved || 1,
                evidence_description: data.evidence_description || 'Sin descripción de evidencia.',
                achieved_date: new Date().toISOString()
            };

            db.insert('competency_log', entry);
            logger.info(`[CompetencyService] Competencia registrada para ${userId}: ${entry.competency_name}`);
            return id;
        } catch (error) {
            logger.error('[CompetencyService] Error registrando competencia', error);
            throw error;
        }
    }

    /**
     * Obtener el perfil de maestría del usuario
     */
    async getMasteryProfile(userId: string): Promise<CompetencyProfile> {
        try {
            const history = db.find<CompetencyEntry>('competency_log', { user_id: userId });

            const profile: CompetencyProfile = {
                userId,
                competencies: {}
            };

            history.forEach(entry => {
                const name = entry.competency_name;
                if (!profile.competencies[name] || profile.competencies[name].level < entry.level_achieved) {
                    profile.competencies[name] = {
                        level: entry.level_achieved,
                        evidenceCount: (profile.competencies[name]?.evidenceCount || 0) + 1,
                        lastAchieved: entry.achieved_date
                    };
                } else {
                    profile.competencies[name].evidenceCount++;
                }
            });

            return profile;
        } catch (error) {
            logger.error('[CompetencyService] Error obteniendo perfil de maestría', error);
            return { userId, competencies: {} };
        }
    }

    /**
     * Obtener competencias por categoría
     */
    async getByCategory(userId: string, category: string): Promise<CompetencyEntry[]> {
        return db.find<CompetencyEntry>('competency_log', {
            user_id: userId,
            competency_category: category
        });
    }

    /**
     * Sugiere nivel de dificultad basado en competencias actuales
     * (Preparación para Fase 11 - Adaptive Lessons)
     */
    async suggestDifficulty(userId: string, topic: string): Promise<{ level: number; reason: string }> {
        const profile = await this.getMasteryProfile(userId);
        const relevantComp = profile.competencies[topic];

        if (!relevantComp) {
            return { level: 1, reason: 'No se encontró evidencia previa de este tema.' };
        }

        if (relevantComp.level >= 3) {
            return { level: 3, reason: 'El alumno demuestra maestría avanzada en este tema.' };
        }

        return { level: relevantComp.level + 1, reason: 'Progresión natural basada en maestría previa.' };
    }
}

export const competencyService = new CompetencyService();
