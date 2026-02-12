/**
 * Review Service - IRP Integration
 */
import * as fs from 'fs';
import * as path from 'path';

const DB_PATH = path.join(process.cwd(), 'db', 'irp_reviews.json');

export interface ReviewRequest {
    id: string;
    created_at: string;
    author_user_id: string;
    project_name: string;
    github_repo_url: string | null;
    code_content: string | null;
    phase: string;
    week: number;
    description: string;
    learning_objectives: string[];
    specific_focus: string[];
    status: 'PENDING_ASSIGNMENT' | 'ASSIGNED' | 'COMPLETED';
}

export interface Review {
    id: string;
    review_request_id: string;
    reviewer_user_id: string;
    puntos_fuertes: string[];
    sugerencias_mejora: string[];
    preguntas_reflexion: string[];
    calificacion_general: {
        claridad_codigo: number;
        arquitectura: number;
        testing: number;
        documentacion: number;
        total: number;
    };
    tiempo_revision_horas: number;
    recomendacion: string;
    submitted_at: string;
}

interface DB {
    requests: ReviewRequest[];
    reviews: Review[];
}

function readDb(): DB {
    try {
        if (!fs.existsSync(DB_PATH)) {
            return { requests: [], reviews: [] };
        }
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')) as DB;
    } catch (e) {
        return { requests: [], reviews: [] };
    }
}

function writeDb(data: DB): boolean {
    try {
        const dbDir = path.dirname(DB_PATH);
        if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        return false;
    }
}

export function calculateUserLevel(peerPoints: number): string {
    if (peerPoints >= 500) return 'Master Reviewer';
    if (peerPoints >= 300) return 'Expert Reviewer';
    if (peerPoints >= 150) return 'Senior Reviewer';
    if (peerPoints >= 50) return 'Experienced Reviewer';
    if (peerPoints >= 20) return 'Junior Reviewer';
    return 'Beginner Reviewer';
}

export function getNextLevelThreshold(currentLevel: string): number {
    const thresholds: Record<string, number> = {
        'Beginner Reviewer': 20,
        'Junior Reviewer': 50,
        'Experienced Reviewer': 150,
        'Senior Reviewer': 300,
        'Expert Reviewer': 500,
        'Master Reviewer': 1000
    };
    return thresholds[currentLevel] || 20;
}

export async function createReviewRequest(data: Partial<ReviewRequest>, userId: string): Promise<ReviewRequest> {
    const db = readDb();
    const newRequest: ReviewRequest = {
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        created_at: new Date().toISOString(),
        author_user_id: userId,
        project_name: data.project_name || 'Untitled Project',
        github_repo_url: data.github_repo_url || null,
        code_content: data.code_content || null,
        phase: data.phase || 'unknown',
        week: data.week || 0,
        description: data.description || '',
        learning_objectives: data.learning_objectives || [],
        specific_focus: data.specific_focus || [],
        status: 'PENDING_ASSIGNMENT'
    };

    db.requests.push(newRequest);
    writeDb(db);
    return newRequest;
}

interface ReviewHistoryOptions {
    role?: 'author' | 'reviewer' | 'both';
    status?: 'pending' | 'completed' | 'all';
    limit?: number;
    offset?: number;
}

export interface ReviewHistoryItem {
    review_id: string;
    project_name: string;
    status: string;
    phase: string;
    week: number;
    created_at: string;
    review: Review | null;
}

export async function getReviewHistory(userId: string, options: ReviewHistoryOptions = {}): Promise<ReviewHistoryItem[]> {
    const db = readDb();
    const { role = 'both', status = 'all', limit = 20, offset = 0 } = options;

    let requests = db.requests;

    if (role === 'author') {
        requests = requests.filter(r => r.author_user_id === userId);
    } else if (role === 'reviewer') {
        const reviewIds = db.reviews.filter(rev => rev.reviewer_user_id === userId).map(rev => rev.review_request_id);
        requests = requests.filter(r => reviewIds.includes(r.id));
    }

    if (status !== 'all') {
        const statusMap: Record<string, string[]> = {
            'pending': ['PENDING_ASSIGNMENT', 'ASSIGNED'],
            'completed': ['COMPLETED']
        };
        const statuses = statusMap[status];
        if (statuses) requests = requests.filter(r => statuses.includes(r.status));
    }

    requests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const sliced = requests.slice(offset, offset + limit);

    return sliced.map(request => {
        const review = db.reviews.find(rev => rev.review_request_id === request.id) || null;
        return {
            review_id: request.id,
            project_name: request.project_name,
            status: request.status.toLowerCase(),
            phase: request.phase,
            week: request.week,
            created_at: request.created_at,
            review
        };
    });
}

export async function getReviewDetails(reviewId: string): Promise<ReviewRequest & { review: Review | undefined }> {
    const db = readDb();
    const request = db.requests.find(r => r.id === reviewId);
    if (!request) throw new Error('Revisión no encontrada');

    const review = db.reviews.find(r => r.review_request_id === reviewId);
    return { ...request, review };
}

export async function saveAIReview(reviewRequestId: string, reviewData: Partial<Review>, reviewerUserId: string): Promise<Review> {
    const db = readDb();
    const calificacion_general = reviewData.calificacion_general || { claridad_codigo: 0, arquitectura: 0, testing: 0, documentacion: 0, total: 0 };
    const total = (
        calificacion_general.claridad_codigo +
        calificacion_general.arquitectura +
        calificacion_general.testing +
        calificacion_general.documentacion
    ) / 4;

    const newReview: Review = {
        id: `rev_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        review_request_id: reviewRequestId,
        reviewer_user_id: reviewerUserId,
        puntos_fuertes: reviewData.puntos_fuertes || [],
        sugerencias_mejora: reviewData.sugerencias_mejora || [],
        preguntas_reflexion: reviewData.preguntas_reflexion || [],
        calificacion_general: { ...calificacion_general, total },
        tiempo_revision_horas: reviewData.tiempo_revision_horas || 0,
        recomendacion: (reviewData.recomendacion || 'NO APROBADO').toUpperCase(),
        submitted_at: new Date().toISOString()
    };

    db.reviews.push(newReview);
    const reqIndex = db.requests.findIndex(r => r.id === reviewRequestId);
    if (reqIndex !== -1) db.requests[reqIndex].status = 'COMPLETED';

    writeDb(db);
    return newReview;
}

export interface UserMetrics {
    reviewer_metrics: {
        total_reviews_completed: number;
        average_review_time_hours: number;
        average_rating_given: number;
    };
    peer_points_total: number;
    current_level: string;
}

export interface SystemStats {
    total_reviews: number;
    pending_reviews: number;
}

export async function calculateUserMetrics(userId: string): Promise<UserMetrics> {
    const db = readDb();
    const reviewsAsReviewer = db.reviews.filter(r => r.reviewer_user_id === userId);
    const totalReviewsCompleted = reviewsAsReviewer.length;

    return {
        reviewer_metrics: {
            total_reviews_completed: totalReviewsCompleted,
            average_review_time_hours: 0,
            average_rating_given: 0
        },
        peer_points_total: totalReviewsCompleted * 10,
        current_level: calculateUserLevel(totalReviewsCompleted * 10)
    };
}

export async function generateSystemStats(): Promise<SystemStats> {
    const db = readDb();
    return {
        total_reviews: db.reviews.length,
        pending_reviews: db.requests.filter(r => r.status !== 'COMPLETED').length
    };
}

export function validateReviewData(reviewData: Partial<Review>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!reviewData.puntos_fuertes || reviewData.puntos_fuertes.length < 1) errors.push('Debe incluir al menos 1 punto fuerte');
    return { isValid: errors.length === 0, errors };
}
