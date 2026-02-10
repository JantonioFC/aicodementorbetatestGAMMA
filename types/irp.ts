export type ReviewStatus = 'pending_assignment' | 'assigned' | 'in_progress' | 'completed' | 'expired';

export interface Review {
    review_id: string;
    project_name: string;
    github_repo_url?: string | null;
    pull_request_url?: string | null;
    code_content?: string | null;
    phase: number;
    week: number;
    description: string;
    learning_objectives: string[];
    specific_focus: string[];
    status: ReviewStatus;
    submitted_at?: string;
    created_at?: string;
    calificacion_promedio?: number;
    author_name?: string;
    role?: 'author' | 'reviewer';
}

export interface ReviewRequestData {
    project_name: string;
    github_repo_url?: string | null;
    pull_request_url?: string | null;
    code_content?: string | null;
    phase: number;
    week: number;
    description: string;
    learning_objectives: string[];
    specific_focus: string[];
}

export interface IRPPagination {
    current_page: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
}

export interface ReviewReport {
    review_id: string;
    project_info: {
        project_name: string;
        phase: number;
        week: number;
        github_repo_url?: string;
    };
    reviewer_info: {
        review_date: string;
    };
    mensaje_tutor?: string;
    recomendacion: 'approve' | 'approve_with_minor_changes' | 'major_revision_needed';
    calificacion_general: {
        claridad_codigo: number;
        arquitectura: number;
        testing: number;
        documentacion: number;
        total: number;
    };
    feedback: {
        puntos_fuertes: { categoria: string; descripcion: string; archivo_referencia?: string; linea_referencia?: number }[];
        sugerencias_mejora: { categoria: string; prioridad: 'alta' | 'media' | 'baja'; descripcion: string; archivo_referencia?: string; linea_referencia?: number }[];
        preguntas_reflexion: { pregunta: string; contexto?: string }[];
    };
    tiempo_revision_horas: number;
    session_id?: string;
}

export interface UserMetrics {
    reviewer_metrics?: {
        total_reviews_completed: number;
        average_rating_given: number;
        average_review_time_hours: number;
    };
}
