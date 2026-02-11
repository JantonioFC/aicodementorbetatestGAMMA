import { db } from '../../db';
import logger from '../../logger';
import crypto from 'crypto';

export interface SharedLesson {
    id: string;
    owner_id: string;
    lesson_id: string;
    title: string;
    description: string;
    category?: string;
    tags?: string[];
    content: any;
    is_public: boolean;
    views_count: number;
    votes_score: number;
    user_vote?: number;
    created_at: string;
    owner_name?: string;
}

export class SharedLessonService {
    /**
     * Share a lesson from sandbox or generated content to the community
     */
    async shareLesson(userId: string, lessonId: string, title: string, description: string, category?: string, tags: string[] = []) {
        try {
            // Find the original content (from sandbox_generations or generated_content)
            // For now, prioritising sandbox_generations as it's the primary source for "finished" lessons
            const sandboxLesson = db.findOne('sandbox_generations', { id: lessonId, user_id: userId }) as any;

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

            db.insert('shared_lessons', newSharedLesson);
            logger.info(`[SharedLessonService] Lesson shared: ${title} by ${userId}`);

            return sharedId;
        } catch (error) {
            logger.error('[SharedLessonService] Error sharing lesson', error);
            throw error;
        }
    }

    /**
     * Get public lessons with optional filters and sorting
     */
    async getPublicLessons(userId?: string, options: { category?: string, sort?: 'latest' | 'top', limit?: number } = {}) {
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

            const params: any[] = userId ? [userId] : [];

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

            const rows = db.query(query, params) as any[];

            return rows.map(row => ({
                ...row,
                tags: row.tags ? JSON.parse(row.tags) : [],
                content: row.content ? JSON.parse(row.content) : null,
                is_public: Boolean(row.is_public)
            }));
        } catch (error) {
            logger.error('[SharedLessonService] Error getting public lessons', error);
            throw error;
        }
    }

    /**
     * Vote for a shared lesson
     */
    async voteLesson(userId: string, sharedId: string, value: number) {
        try {
            if (![-1, 1].includes(value)) {
                throw new Error('Invalid vote value. Must be 1 or -1.');
            }

            const existingVote = db.findOne('shared_lesson_votes', { user_id: userId, shared_lesson_id: sharedId }) as any;

            if (existingVote) {
                if (existingVote.vote_value === value) {
                    // Remove vote if same value (toggle)
                    db.run('DELETE FROM shared_lesson_votes WHERE user_id = ? AND shared_lesson_id = ?', [userId, sharedId]);
                } else {
                    // Update vote
                    db.update('shared_lesson_votes', { vote_value: value }, { user_id: userId, shared_lesson_id: sharedId });
                }
            } else {
                // Insert new vote
                db.insert('shared_lesson_votes', {
                    id: `v_${crypto.randomUUID()}`,
                    user_id: userId,
                    shared_lesson_id: sharedId,
                    vote_value: value,
                    created_at: new Date().toISOString()
                });
            }

            return true;
        } catch (error) {
            logger.error('[SharedLessonService] Error voting for lesson', error);
            throw error;
        }
    }

    /**
     * Increment view count
     */
    async incrementViews(sharedId: string) {
        try {
            db.run('UPDATE shared_lessons SET views_count = views_count + 1 WHERE id = ?', [sharedId]);
        } catch (error) {
            logger.error('[SharedLessonService] Error incrementing views', error);
        }
    }
}

export const sharedLessonService = new SharedLessonService();
