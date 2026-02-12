import { db, QueryParams } from '../../db';
import { logger } from '../../observability/Logger';
import crypto from 'crypto';

export interface PublicFeedItem {
    id: string;
    title: string;
    description: string;
    owner_id: string;
    owner_name: string;
    created_at: string;
    review_count: number;
    avg_rating: number;
}

export interface LessonReview {
    id: string;
    rating: number;
    comment: string;
    reviewer_id: string;
    reviewer_name: string;
    created_at: string;
}

/**
 * PeerReviewService - Gestiona el intercambio de conocimientos entre alumnos.
 * Permite compartir lecciones y dejar valoraciones/comentarios.
 */
export class PeerReviewService {
    /**
     * Comparte una lección del sandbox para que otros puedan verla.
     */
    async shareLesson(ownerId: string, lessonId: string, title: string, description?: string): Promise<{ id: string }> {
        try {
            const id = `sh_${crypto.randomUUID()}`;
            db.insert('shared_lessons', {
                id,
                owner_id: ownerId,
                lesson_id: lessonId,
                title,
                description: description || '',
                is_public: 1,
                created_at: new Date().toISOString()
            } as Record<string, QueryParams>);
            logger.info(`[PeerReview] Lección compartida: ${title} por ${ownerId}`);
            return { id };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error(`[PeerReview] Error compartiendo lección: ${message}`);
            throw error;
        }
    }

    /**
     * Obtiene el feed de lecciones compartidas.
     */
    async getPublicFeed(limit = 10): Promise<PublicFeedItem[]> {
        return db.query<PublicFeedItem>(`
            SELECT 
                sl.id, 
                sl.title, 
                sl.description, 
                sl.owner_id,
                up.display_name as owner_name,
                sl.created_at,
                (SELECT COUNT(*) FROM lesson_reviews WHERE shared_lesson_id = sl.id) as review_count,
                (SELECT AVG(rating) FROM lesson_reviews WHERE shared_lesson_id = sl.id) as avg_rating
            FROM shared_lessons sl
            JOIN user_profiles up ON sl.owner_id = up.id
            WHERE sl.is_public = 1
            ORDER BY sl.created_at DESC
            LIMIT ?
        `, [limit]);
    }

    /**
     * Agrega una revisión a una lección compartida.
     */
    async addReview(reviewerId: string, sharedLessonId: string, rating: number, comment: string): Promise<{ id: string }> {
        try {
            const id = `rev_${crypto.randomUUID()}`;
            db.insert('lesson_reviews', {
                id,
                shared_lesson_id: sharedLessonId,
                reviewer_id: reviewerId,
                rating,
                comment,
                created_at: new Date().toISOString()
            } as Record<string, QueryParams>);
            logger.info(`[PeerReview] Nueva revisión en ${sharedLessonId} por ${reviewerId}`);
            return { id };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error(`[PeerReview] Error agregando revisión: ${message}`);
            throw error;
        }
    }

    /**
     * Obtiene las revisiones de una lección compartida.
     */
    async getLessonReviews(sharedLessonId: string): Promise<LessonReview[]> {
        return db.query<LessonReview>(`
            SELECT 
                lr.id, 
                lr.rating, 
                lr.comment, 
                lr.reviewer_id,
                up.display_name as reviewer_name,
                lr.created_at
            FROM lesson_reviews lr
            JOIN user_profiles up ON lr.reviewer_id = up.id
            WHERE lr.shared_lesson_id = ?
            ORDER BY lr.created_at DESC
        `, [sharedLessonId]);
    }
}

export const peerReviewService = new PeerReviewService();
