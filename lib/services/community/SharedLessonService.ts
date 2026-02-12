import { db, QueryParams } from '../../db';
import { logger } from '../../observability/Logger';
import crypto from 'crypto';

export interface SharedLesson {
    id: string;
    owner_id: string;
    lesson_id: string;
    title: string;
    description: string;
    category?: string;
    tags?: string[];
    content: unknown;
    is_public: boolean;
    views_count: number;
    votes_score: number;
    user_vote?: number;
    created_at: string;
    owner_name?: string;
}

interface SandboxLessonRow {
    id: string;
    user_id: string;
    generated_lesson: string;
}

interface SharedLessonVoteRow {
    id: string;
    user_id: string;
    shared_lesson_id: string;
    vote_value: number;
    created_at: string;
}

export class SharedLessonService {
    /**
     * Share a lesson from sandbox or generated content to the community
     */
    async shareLesson(userId: string, lessonId: string, title: string, description: string, category?: string, tags: string[] = []): Promise<string> {
        try {
            // Find the original content (from sandbox_generations or generated_content)
            const sandboxLesson = db.findOne<SandboxLessonRow>('sandbox_generations', { id: lessonId, user_id: userId } as Record<string, QueryParams>);

            if (!sandboxLesson) {
                throw new Error('Lesson not found or you do not have permission to share it.');
            }

            const sharedId = `sh_${crypto.randomUUID()}`;
            const newSharedLesson = {
                id: sharedId,
                owner_id: userId,
                lesson_id: lessonId,
                title: title,
                description: description,
                category: category || 'General',
                tags: JSON.stringify(tags),
                content: sandboxLesson.generated_lesson, // Snapshot of the content
                is_public: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            db.insert('shared_lessons', newSharedLesson as unknown as Record<string, QueryParams>);
            logger.info(`[SharedLessonService] Lesson shared: ${title} by ${userId}`);

            return sharedId;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error(`[SharedLessonService] Error sharing lesson: ${message}`);
            throw error;
        }
    }

    /**
     * Get public lessons with optional filters and sorting
     */
    async getPublicLessons(userId?: string, options: { category?: string, sort?: 'latest' | 'top', limit?: number } = {}): Promise<SharedLesson[]> {
        try {
            const { category, sort = 'latest', limit = 20 } = options;

            let query = `
                SELECT 
                    sl.*, 
                    up.display_name as owner_name,
                    COALESCE(SUM(slv.vote_value), 0) as votes_score
                    ${userId ? ', (SELECT vote_value FROM shared_lesson_votes WHERE shared_lesson_id = sl.id AND user_id = ?) as user_vote' : ''}
                FROM shared_lessons sl
                JOIN user_profiles up ON sl.owner_id = up.id
                LEFT JOIN shared_lesson_votes slv ON sl.id = slv.shared_lesson_id
                WHERE sl.is_public = 1
            `;

            const params: QueryParams[] = userId ? [userId] : [];

            if (category) {
                query += ' AND sl.category = ?';
                params.push(category);
            }

            query += ' GROUP BY sl.id';

            if (sort === 'top') {
                query += ' ORDER BY votes_score DESC, sl.created_at DESC';
            } else {
                query += ' ORDER BY sl.created_at DESC';
            }

            query += ' LIMIT ?';
            params.push(limit);

            const rows = db.query<Record<string, unknown>>(query, params);

            return rows.map(row => ({
                id: String(row.id),
                owner_id: String(row.owner_id),
                lesson_id: String(row.lesson_id),
                title: String(row.title),
                description: String(row.description),
                category: row.category ? String(row.category) : undefined,
                tags: row.tags ? JSON.parse(String(row.tags)) : [],
                content: row.content ? JSON.parse(String(row.content)) : null,
                is_public: Boolean(row.is_public),
                views_count: Number(row.views_count),
                votes_score: Number(row.votes_score),
                user_vote: row.user_vote ? Number(row.user_vote) : undefined,
                created_at: String(row.created_at),
                owner_name: row.owner_name ? String(row.owner_name) : undefined
            }));
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error(`[SharedLessonService] Error getting public lessons: ${message}`);
            throw error;
        }
    }

    /**
     * Vote for a shared lesson
     */
    async voteLesson(userId: string, sharedId: string, value: number): Promise<boolean> {
        try {
            if (![-1, 1].includes(value)) {
                throw new Error('Invalid vote value. Must be 1 or -1.');
            }

            const existingVote = db.findOne<SharedLessonVoteRow>('shared_lesson_votes', { user_id: userId, shared_lesson_id: sharedId } as Record<string, QueryParams>);

            if (existingVote) {
                if (existingVote.vote_value === value) {
                    // Remove vote if same value (toggle)
                    db.run('DELETE FROM shared_lesson_votes WHERE user_id = ? AND shared_lesson_id = ?', [userId, sharedId]);
                } else {
                    // Update vote
                    db.update('shared_lesson_votes', { vote_value: value } as Record<string, QueryParams>, { user_id: userId, shared_lesson_id: sharedId } as Record<string, QueryParams>);
                }
            } else {
                // Insert new vote
                db.insert('shared_lesson_votes', {
                    id: `v_${crypto.randomUUID()}`,
                    user_id: userId,
                    shared_lesson_id: sharedId,
                    vote_value: value,
                    created_at: new Date().toISOString()
                } as Record<string, QueryParams>);
            }

            return true;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error(`[SharedLessonService] Error voting for lesson: ${message}`);
            throw error;
        }
    }

    /**
     * Increment view count
     */
    async incrementViews(sharedId: string): Promise<void> {
        try {
            db.run('UPDATE shared_lessons SET views_count = views_count + 1 WHERE id = ?', [sharedId]);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error(`[SharedLessonService] Error incrementing views: ${message}`);
        }
    }
}

export const sharedLessonService = new SharedLessonService();
