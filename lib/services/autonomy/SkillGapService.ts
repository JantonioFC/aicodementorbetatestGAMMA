import { db } from '../../db';
import { logger } from '../../observability/Logger';
import { competencyService } from '../CompetencyService';
import crypto from 'crypto';

export interface SkillGap {
    id: string;
    user_id: string;
    topic: string;
    current_level: number;
    target_level: number;
    gap_score: number;
}

export interface TargetProfile {
    name: string;
    requirements: Record<string, number>; // topic -> required_level
}

const PREDEFINED_PROFILES: Record<string, TargetProfile> = {
    'frontend-starter': {
        name: 'Frontend Developer (Junior)',
        requirements: {
            'HTML': 3,
            'CSS': 3,
            'JavaScript': 2,
            'React': 1
        }
    },
    'backend-starter': {
        name: 'Backend Developer (Junior)',
        requirements: {
            'Node.js': 2,
            'SQL': 2,
            'API Design': 1,
            'Auth': 1
        }
    }
};

export class SkillGapService {
    /**
     * Identifica las brechas de conocimiento para un usuario basado en un perfil objetivo.
     */
    async analyzeGaps(userId: string, profileKey: string = 'frontend-starter'): Promise<SkillGap[]> {
        try {
            const profile = PREDEFINED_PROFILES[profileKey];
            if (!profile) throw new Error('Target profile not found');

            const userProfile = await competencyService.getMasteryProfile(userId);
            const gaps: SkillGap[] = [];

            for (const [topic, targetLevel] of Object.entries(profile.requirements)) {
                const currentLevel = userProfile.competencies[topic]?.level || 0;

                if (currentLevel < targetLevel) {
                    const gapScore = targetLevel - currentLevel;
                    const gap: SkillGap = {
                        id: crypto.randomUUID(),
                        user_id: userId,
                        topic,
                        current_level: currentLevel,
                        target_level: targetLevel,
                        gap_score: gapScore
                    };

                    // Guardar snapshot en la DB
                    db.run(`
                        INSERT INTO skill_gaps (id, user_id, topic, current_level, target_level, gap_score, last_analyzed_at)
                        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                        ON CONFLICT(id) DO UPDATE SET
                            current_level = excluded.current_level,
                            gap_score = excluded.gap_score,
                            last_analyzed_at = CURRENT_TIMESTAMP
                    `, [gap.id, userId, topic, currentLevel, targetLevel, gapScore]);

                    gaps.push(gap);
                }
            }

            logger.info(`[SkillGap] Análisis completado para ${userId}: ${gaps.length} brechas detectadas.`);
            return gaps;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error(`[SkillGap] Error en análisis para ${userId}: ${message}`);
            throw error;
        }
    }

    /**
     * Obtiene las brechas guardadas más críticas.
     */
    async getStoredGaps(userId: string): Promise<SkillGap[]> {
        return db.query<SkillGap>('SELECT * FROM skill_gaps WHERE user_id = ? ORDER BY gap_score DESC', [userId]);
    }
}

export const skillGapService = new SkillGapService();
