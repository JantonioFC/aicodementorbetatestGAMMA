/**
 * Review Service - IRP Integration
 */
import * as fs from 'fs';
import * as path from 'path';

const DB_PATH = path.join(process.cwd(), 'db', 'irp_reviews.json');

function readDb(): any {
    try {
        if (!fs.existsSync(DB_PATH)) {
            return { requests: [], reviews: [] };
        }
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    } catch (e) {
        return { requests: [], reviews: [] };
    }
}

function writeDb(data: any): boolean {
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

export async function createReviewRequest(data: any, userId: string): Promise<any> {
    const db = readDb();
    const newRequest = {
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        created_at: new Date().toISOString(),
        author_user_id: userId,
        project_name: data.project_name,
        github_repo_url: data.github_repo_url || null,
        code_content: data.code_content || null,
        phase: data.phase,
        week: data.week,
        description: data.description,
        learning_objectives: data.learning_objectives || [],
        specific_focus: data.specific_focus || [],
        status: 'PENDING_ASSIGNMENT'
    };

    db.requests.push(newRequest);
    writeDb(db);
    return newRequest;
}

export async function getReviewHistory(userId: string, options: any = {}): Promise<any[]> {
    const db = readDb();
    const { role = 'both', status = 'all', limit = 20, offset = 0 } = options;

    let requests = db.requests as any[];

    if (role === 'author') {
        requests = requests.filter(r => r.author_user_id === userId);
    } else if (role === 'reviewer') {
        const reviewIds = db.reviews.filter((rev: any) => rev.reviewer_user_id === userId).map((rev: any) => rev.review_request_id);
        requests = requests.filter(r => reviewIds.includes(r.id));
    }

    if (status !== 'all') {
        const statusMap: Record<string, string[]> = {
            'pending': ['PENDING_ASSIGNMENT', 'ASSIGNED'],
            'completed': ['COMPLETED']
        };
        if (statusMap[status]) requests = requests.filter(r => statusMap[status].includes(r.status));
    }

    requests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const sliced = requests.slice(offset, offset + limit);

    return sliced.map(request => {
        const review = db.reviews.find((rev: any) => rev.review_request_id === request.id) || null;
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

export async function getReviewDetails(reviewId: string): Promise<any> {
    const db = readDb();
    const request = db.requests.find((r: any) => r.id === reviewId);
    if (!request) throw new Error('Revisión no encontrada');

    const review = db.reviews.find((r: any) => r.review_request_id === reviewId);
    return { ...request, review };
}

export async function saveAIReview(reviewRequestId: string, reviewData: any, reviewerUserId: string): Promise<any> {
    const db = readDb();
    const { calificacion_general } = reviewData;
    const total = (
        calificacion_general.claridad_codigo +
        calificacion_general.arquitectura +
        calificacion_general.testing +
        calificacion_general.documentacion
    ) / 4;

    const newReview = {
        id: `rev_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        review_request_id: reviewRequestId,
        reviewer_user_id: reviewerUserId,
        puntos_fuertes: reviewData.puntos_fuertes,
        sugerencias_mejora: reviewData.sugerencias_mejora,
        preguntas_reflexion: reviewData.preguntas_reflexion,
        calificacion_general: { ...calificacion_general, total },
        tiempo_revision_horas: reviewData.tiempo_revision_horas,
        recomendacion: reviewData.recomendacion.toUpperCase(),
        submitted_at: new Date().toISOString()
    };

    db.reviews.push(newReview);
    const reqIndex = db.requests.findIndex((r: any) => r.id === reviewRequestId);
    if (reqIndex !== -1) db.requests[reqIndex].status = 'COMPLETED';

    writeDb(db);
    return newReview;
}

export async function calculateUserMetrics(userId: string): Promise<any> {
    const db = readDb();
    const reviewsAsReviewer = db.reviews.filter((r: any) => r.reviewer_user_id === userId);
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

export async function generateSystemStats(): Promise<any> {
    const db = readDb();
    return {
        total_reviews: db.reviews.length,
        pending_reviews: db.requests.filter((r: any) => r.status !== 'COMPLETED').length
    };
}

export function validateReviewData(reviewData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!reviewData.puntos_fuertes || reviewData.puntos_fuertes.length < 1) errors.push('Debe incluir al menos 1 punto fuerte');
    return { isValid: errors.length === 0, errors };
}
