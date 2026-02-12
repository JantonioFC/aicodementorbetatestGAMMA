import { db } from '../../db';
import { logger } from '../../observability/Logger';

export interface LeaderboardEntry {
    user_id: string;
    display_name: string;
    total_points: number;
    lessons_shared: number;
    upvotes_received: number;
    rank_title: string;
    avatar_url?: string;
}

interface UserRow {
    id: string;
}

interface UserMetricsResult {
    lessons: number;
    quizzes: number;
    shared: number;
    upvotes: number;
    peer_points: number;
}

interface CommunityMetricsData {
    user_id: string;
    total_points: number;
    lessons_shared_count: number;
    total_upvotes_received: number;
    rank_title: string;
    last_computed_at: string;
}

export class LeaderboardService {
    /**
     * Point values for various activities
     */
    private readonly POINTS = {
        LESSON_COMPLETED: 50,
        QUIZ_CORRECT_ANSWER: 10,
        LESSON_SHARED: 100,
        UPVOTE_RECEIVED: 20,
        PEER_REVIEW_COMPLETED: 75
    } as const;

    /**
     * Recalculate points for all users or a specific user
     */
    async recalculateMetrics(userId?: string): Promise<void> {
        try {
            const usersToUpdate = userId ? [{ id: userId }] : db.query<UserRow>('SELECT id FROM user_profiles');

            for (const user of usersToUpdate) {
                const targetId = user.id;

                // 1. Progress Stats (Quizzes, Lessons, Exercises)
                // We'll use the profile service logic or query directly
                const statsQuery = `
                    SELECT 
                        (SELECT COUNT(*) FROM user_lesson_progress WHERE user_id = ? AND completed = 1) as lessons,
                        (SELECT COUNT(*) FROM quiz_attempts WHERE user_id = ? AND is_correct = 1) as quizzes,
                        (SELECT COUNT(*) FROM shared_lessons WHERE owner_id = ?) as shared,
                        (SELECT COUNT(*) FROM shared_lesson_votes slv JOIN shared_lessons sl ON sl.id = slv.shared_lesson_id WHERE sl.owner_id = ? AND slv.vote_value = 1) as upvotes,
                        (SELECT COALESCE(peer_points_total, 0) FROM irp_user_metrics WHERE user_id = ?) as peer_points
                `;

                const data = db.get<UserMetricsResult>(statsQuery, [targetId, targetId, targetId, targetId, targetId]);

                if (!data) continue;

                // 2. Calculate Total Points
                const totalPoints =
                    (data.lessons * this.POINTS.LESSON_COMPLETED) +
                    (data.quizzes * this.POINTS.QUIZ_CORRECT_ANSWER) +
                    (data.shared * this.POINTS.LESSON_SHARED) +
                    (data.upvotes * this.POINTS.UPVOTE_RECEIVED) +
                    data.peer_points;

                // 3. Determine Rank Title
                let rank = 'Novato';
                if (totalPoints > 5000) rank = 'Mentor Legendario';
                else if (totalPoints > 2000) rank = 'Experto Senior';
                else if (totalPoints > 1000) rank = 'Desarrollador Avanzado';
                else if (totalPoints > 500) rank = 'Estudiante Activo';

                // 4. Update community_metrics
                const existing = db.findOne('community_metrics', { user_id: targetId });

                const metrics: CommunityMetricsData = {
                    user_id: targetId,
                    total_points: totalPoints,
                    lessons_shared_count: data.shared,
                    total_upvotes_received: data.upvotes,
                    rank_title: rank,
                    last_computed_at: new Date().toISOString()
                };

                if (existing) {
                    db.update('community_metrics', metrics as unknown as Record<string, import('../../db').QueryParams>, { user_id: targetId } as Record<string, import('../../db').QueryParams>);
                } else {
                    db.insert('community_metrics', { ...metrics, id: `m_${targetId}` } as unknown as Record<string, import('../../db').QueryParams>);
                }
            }

            logger.info(`[LeaderboardService] Metrics updated for ${userId ? 'user ' + userId : 'all users'}`);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error(`[LeaderboardService] Error recalculating metrics: ${message}`);
        }
    }

    /**
     * Get the top students for the leaderboard
     */
    async getTopStudents(limit: number = 10): Promise<LeaderboardEntry[]> {
        try {
            const query = `
                SELECT 
                    cm.user_id,
                    up.display_name,
                    cm.total_points,
                    cm.lessons_shared_count as lessons_shared,
                    cm.total_upvotes_received as upvotes_received,
                    cm.rank_title
                FROM community_metrics cm
                JOIN user_profiles up ON cm.user_id = up.id
                ORDER BY cm.total_points DESC
                LIMIT ?
            `;

            return db.query<LeaderboardEntry>(query, [limit]);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error(`[LeaderboardService] Error getting top students: ${message}`);
            return [];
        }
    }
}

export const leaderboardService = new LeaderboardService();
