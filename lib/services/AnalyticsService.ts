import db from '../db';

export interface AnalyticsOverview {
    lessons: {
        total: number;
        avgScore: number;
    };
    sessions: {
        active: number;
        totalUsers: number;
    };
    feedback: {
        total: number;
        avgRating: number;
    };
}

export interface LessonPerDay {
    date: string;
    count: number;
    avgScore: number;
}

export interface ScoreDistribution {
    grade: string;
    count: number;
}

export interface RecentFeedback {
    id: string;
    lesson_id: string;
    rating: number;
    feedback_type: string;
    comment: string;
    created_at: string;
}

export interface EvaluationMetricsResults {
    avgFaithfulness: number;
    avgRelevance: number;
    avgLength: number;
    avgStructure: number;
    avgNoHallucination: number;
    totalEvaluations: number;
    passed: number;
    withExamples: number;
    withQuiz: number;
}

export interface ComponentMetrics {
    components: {
        faithfulness: number;
        relevance: number;
        length: number;
        structure: number;
        noHallucination: number;
    };
    totals: {
        evaluations: number;
        passRate: number;
        withExamples: number;
        withQuiz: number;
    };
}

export class AnalyticsService {
    /**
     * Obtiene estadísticas generales del sistema.
     */
    getOverview(): AnalyticsOverview {
        const lessonsGenerated = db.get<{ total: number }>(`
            SELECT COUNT(*) as total FROM lesson_evaluations
        `)?.total || 0;

        const avgScore = db.get<{ avg: number }>(`
            SELECT AVG(overall_score) as avg FROM lesson_evaluations
        `)?.avg || 0;

        const activeSessions = db.get<{ total: number }>(`
            SELECT COUNT(*) as total FROM learning_sessions WHERE status = 'ACTIVE'
        `)?.total || 0;

        const totalUsers = db.get<{ total: number }>(`
            SELECT COUNT(DISTINCT user_id) as total FROM learning_sessions
        `)?.total || 0;

        const feedbackCount = db.get<{ total: number }>(`
            SELECT COUNT(*) as total FROM lesson_feedback
        `)?.total || 0;

        const avgFeedbackRating = db.get<{ avg: number }>(`
            SELECT AVG(rating) as avg FROM lesson_feedback
        `)?.avg || 0;

        return {
            lessons: {
                total: lessonsGenerated,
                avgScore: Math.round(avgScore * 10) / 10
            },
            sessions: {
                active: activeSessions,
                totalUsers
            },
            feedback: {
                total: feedbackCount,
                avgRating: Math.round(avgFeedbackRating * 10) / 10
            }
        };
    }

    /**
     * Obtiene lecciones generadas por día.
     */
    getLessonsPerDay(days = 30): LessonPerDay[] {
        return db.query<LessonPerDay>(`
            SELECT 
                date(created_at) as date,
                COUNT(*) as count,
                AVG(overall_score) as avgScore
            FROM lesson_evaluations 
            WHERE created_at >= datetime('now', '-${days} days')
            GROUP BY date(created_at)
            ORDER BY date DESC
        `);
    }

    /**
     * Obtiene distribución de scores de evaluación.
     */
    getScoreDistribution(): ScoreDistribution[] {
        return db.query<ScoreDistribution>(`
            SELECT 
                CASE 
                    WHEN overall_score >= 90 THEN 'A (90-100)'
                    WHEN overall_score >= 80 THEN 'B (80-89)'
                    WHEN overall_score >= 70 THEN 'C (70-79)'
                    WHEN overall_score >= 60 THEN 'D (60-69)'
                    ELSE 'F (<60)'
                END as grade,
                COUNT(*) as count
            FROM lesson_evaluations
            GROUP BY grade
            ORDER BY 
                CASE grade 
                    WHEN 'A (90-100)' THEN 1
                    WHEN 'B (80-89)' THEN 2
                    WHEN 'C (70-79)' THEN 3
                    WHEN 'D (60-69)' THEN 4
                    ELSE 5
                END
        `);
    }

    /**
     * Obtiene feedback reciente.
     */
    getRecentFeedback(limit = 10): RecentFeedback[] {
        return db.query<RecentFeedback>(`
            SELECT 
                id,
                lesson_id,
                rating,
                feedback_type,
                comment,
                created_at
            FROM lesson_feedback
            ORDER BY created_at DESC
            LIMIT ?
        `, [limit]);
    }

    /**
     * Obtiene métricas de evaluación por componente.
     */
    getEvaluationMetrics(): ComponentMetrics {
        const metrics = db.get<EvaluationMetricsResults>(`
            SELECT 
                AVG(faithfulness_score) as avgFaithfulness,
                AVG(relevance_score) as avgRelevance,
                AVG(length_score) as avgLength,
                AVG(structure_score) as avgStructure,
                AVG(no_hallucination_score) as avgNoHallucination,
                COUNT(*) as totalEvaluations,
                SUM(CASE WHEN overall_score >= 70 THEN 1 ELSE 0 END) as passed,
                SUM(CASE WHEN has_examples = 1 THEN 1 ELSE 0 END) as withExamples,
                SUM(CASE WHEN has_quiz = 1 THEN 1 ELSE 0 END) as withQuiz
            FROM lesson_evaluations
        `);

        const totalEvaluations = metrics?.totalEvaluations || 0;

        return {
            components: {
                faithfulness: Math.round(metrics?.avgFaithfulness || 0),
                relevance: Math.round(metrics?.avgRelevance || 0),
                length: Math.round(metrics?.avgLength || 0),
                structure: Math.round(metrics?.avgStructure || 0),
                noHallucination: Math.round(metrics?.avgNoHallucination || 0)
            },
            totals: {
                evaluations: totalEvaluations,
                passRate: totalEvaluations > 0
                    ? Math.round(((metrics?.passed || 0) / totalEvaluations) * 100)
                    : 0,
                withExamples: metrics?.withExamples || 0,
                withQuiz: metrics?.withQuiz || 0
            }
        };
    }

    /**
     * Obtiene actividad por semana del currículo.
     */
    getActivityByWeek(): Array<{ semana: string; interactions: number }> {
        return db.query<{ semana: string; interactions: number }>(`
            SELECT 
                json_extract(content, '$.semana') as semana,
                COUNT(*) as interactions
            FROM session_interactions
            WHERE interaction_type = 'LESSON_GENERATED'
            GROUP BY semana
            ORDER BY CAST(semana AS INTEGER)
        `);
    }

    /**
     * Obtiene usuarios más activos.
     */
    getTopUsers(limit = 10): Array<{ user_id: string; sessions: number; interactions: number; lastActive: string }> {
        return db.query<{ user_id: string; sessions: number; interactions: number; lastActive: string }>(`
            SELECT 
                ls.user_id,
                COUNT(DISTINCT ls.id) as sessions,
                COUNT(si.id) as interactions,
                MAX(si.created_at) as lastActive
            FROM learning_sessions ls
            LEFT JOIN session_interactions si ON ls.id = si.session_id
            GROUP BY ls.user_id
            ORDER BY interactions DESC
            LIMIT ?
        `, [limit]);
    }
}

export const analyticsService = new AnalyticsService();
