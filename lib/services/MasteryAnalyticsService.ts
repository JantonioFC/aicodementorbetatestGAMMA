import { db } from '../db';
import logger from '../logger';

export interface MasteryReport {
    userId: string;
    overallStats: {
        totalLogCount: number;
        masteredCount: number; // level >= 3
        uniqueCompetencies: number;
    };
    categoryProgress: Array<{
        category: string;
        count: number;
        avgLevel: number;
    }>;
    recentMastery: Array<{
        competency: string;
        level: number;
        date: string;
    }>;
    topMasteries: Array<{
        competency: string;
        level: number;
    }>;
}

/**
 * MasteryAnalyticsService - Procesa el registro de competencias para generar visualizaciones del progreso del alumno.
 */
export class MasteryAnalyticsService {

    /**
     * Genera un reporte completo de maestría para un usuario.
     */
    async getUserMastery(userId: string): Promise<MasteryReport> {
        try {
            // 1. Estadísticas Generales
            const stats: any = db.get(`
                SELECT 
                    COUNT(*) as totalLogs,
                    COUNT(DISTINCT competency_name) as uniqueCompetencies,
                    SUM(CASE WHEN level_achieved >= 3 THEN 1 ELSE 0 END) as mastered
                FROM competency_log
                WHERE user_id = ?
            `, [userId]);

            // 2. Progreso por Categoría
            const categoryStats = db.query(`
                SELECT 
                    competency_category as category,
                    COUNT(*) as count,
                    AVG(level_achieved) as avgLevel
                FROM competency_log
                WHERE user_id = ?
                GROUP BY competency_category
                ORDER BY count DESC
            `, [userId]);

            // 3. Logros Recientes
            const recent = db.query(`
                SELECT 
                    competency_name as competency,
                    level_achieved as level,
                    log_date as date
                FROM competency_log
                WHERE user_id = ?
                ORDER BY log_date DESC
                LIMIT 5
            `, [userId]);

            // 4. Top Maestría (Mejor nivel por cada competencia única)
            const top = db.query(`
                SELECT 
                    competency_name as competency,
                    MAX(level_achieved) as level
                FROM competency_log
                WHERE user_id = ?
                GROUP BY competency_name
                ORDER BY level DESC, competency_name ASC
                LIMIT 10
            `, [userId]);

            return {
                userId,
                overallStats: {
                    totalLogCount: stats?.totalLogs || 0,
                    masteredCount: stats?.mastered || 0,
                    uniqueCompetencies: stats?.uniqueCompetencies || 0
                },
                categoryProgress: categoryStats.map((c: any) => ({
                    category: c.category,
                    count: c.count,
                    avgLevel: Math.round(c.avgLevel * 10) / 10
                })),
                recentMastery: recent.map((r: any) => ({
                    competency: r.competency,
                    level: r.level,
                    date: r.date
                })),
                topMasteries: top.map((t: any) => ({
                    competency: t.competency,
                    level: t.level
                }))
            };

        } catch (error: any) {
            logger.error(`[AnalyticsService] Error generando reporte para ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene una lista de recomendaciones basada en competencias con nivel bajo.
     */
    async getRecommendations(userId: string): Promise<string[]> {
        const weakPoints = db.query(`
            SELECT competency_name
            FROM competency_log
            WHERE user_id = ?
            GROUP BY competency_name
            HAVING MAX(level_achieved) < 2
            LIMIT 3
        `, [userId]);

        return weakPoints.map((p: any) => p.competency_name);
    }
}

export const masteryAnalyticsService = new MasteryAnalyticsService();
