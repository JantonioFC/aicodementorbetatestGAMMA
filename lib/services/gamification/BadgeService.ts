import { db } from '../../db';
import logger from '../../logger';
import crypto from 'crypto';

export interface BadgeDefinition {
    key: string;
    name: string;
    description: string;
    icon: string;
    rule: (stats: any) => boolean;
}

/**
 * BadgeService - Gestor de gamificación y logros.
 * Evalúa las competencias del alumno para otorgar insignias dinámicas.
 */
export class BadgeService {
    private badgeDefinitions: BadgeDefinition[] = [
        {
            key: 'explorer_pioneer',
            name: 'Pionero Explorador',
            description: 'Has registrado tu primera competencia en el ecosistema.',
            icon: '🧭',
            rule: (stats) => stats.totalLogs >= 1
        },
        {
            key: 'theory_master',
            name: 'Maestro de la Teoría',
            description: 'Alcanzaste nivel 3 en 3 conceptos teóricos diferentes.',
            icon: '📜',
            rule: (stats) => stats.categories['Conceptos Teóricos']?.mastered >= 3
        },
        {
            key: 'logical_thinker',
            name: 'Pensador Lógico',
            description: 'Dominaste competencias de Lógica de Programación.',
            icon: '🧠',
            rule: (stats) => stats.competencies['Lógica de Programación'] >= 3
        },
        {
            key: 'quiz_crusher',
            name: 'Demoledor de Quizzes',
            description: 'Completaste 10 interacciones correctas en quizzes.',
            icon: '⚡',
            rule: (stats) => stats.totalLogs >= 10
        }
    ];

    /**
     * Verifica y otorga nuevos logros basados en el estado actual de maestría.
     */
    async checkAndAwardBadges(userId: string): Promise<{ newBadges: string[] }> {
        try {
            logger.info(`[BadgeService] Verificando logros para ${userId}`);

            // 1. Obtener estadísticas del alumno para evaluar reglas
            const stats = await this._getStudentStatsForRules(userId);

            // 2. Obtener logros ya poseídos
            const existingBadges: any = db.query('SELECT achievement_key FROM achievements WHERE user_id = ?', [userId]);
            const existingKeys = new Set(existingBadges.map((b: any) => b.achievement_key));

            const newBadges: string[] = [];

            // 3. Evaluar cada definición de insignia
            for (const badge of this.badgeDefinitions) {
                if (!existingKeys.has(badge.key) && badge.rule(stats)) {
                    // Otorga el logro
                    const id = `ach_${crypto.randomUUID()}`;
                    db.insert('achievements', {
                        id,
                        user_id: userId,
                        achievement_key: badge.key,
                        name: badge.name,
                        description: badge.description,
                        icon: badge.icon,
                        unlocked_at: new Date().toISOString()
                    });

                    newBadges.push(badge.name);
                    logger.info(`[BadgeService] ¡Logro desbloqueado para ${userId}: ${badge.name}!`);
                }
            }

            return { newBadges };
        } catch (error: any) {
            logger.error(`[BadgeService] Error verificando logros:`, error);
            throw error;
        }
    }

    /**
     * Obtiene los logros actuales del usuario.
     */
    async getUserAchievements(userId: string) {
        return db.query(`
            SELECT id, name, description, icon, unlocked_at as unlockedAt
            FROM achievements
            WHERE user_id = ?
            ORDER BY unlocked_at DESC
        `, [userId]);
    }

    /**
     * Genera un objeto de estadísticas optimizado para la evaluación de reglas.
     */
    private async _getStudentStatsForRules(userId: string): Promise<any> {
        const logs: any = db.query('SELECT competency_name, competency_category, level_achieved FROM competency_log WHERE user_id = ?', [userId]);

        const stats: any = {
            totalLogs: logs.length,
            categories: {},
            competencies: {}
        };

        logs.forEach((log: any) => {
            // Stats por categoría
            if (!stats.categories[log.competency_category]) {
                stats.categories[log.competency_category] = { total: 0, mastered: 0 };
            }
            stats.categories[log.competency_category].total++;
            if (log.level_achieved >= 3) {
                stats.categories[log.competency_category].mastered++;
            }

            // Stats por competencia individual (mejor nivel)
            if (!stats.competencies[log.competency_name] || log.level_achieved > stats.competencies[log.competency_name]) {
                stats.competencies[log.competency_name] = log.level_achieved;
            }
        });

        return stats;
    }
}

export const badgeService = new BadgeService();
