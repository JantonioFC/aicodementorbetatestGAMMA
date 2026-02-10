export interface ProgressSummary {
    metadata: {
        generatedAt: string;
        userId: string;
    };
    summary: {
        totalSemanasCompletadas: number;
        totalSemanasIniciadas: number;
        porcentajeTotalCompletado: number;
    };
    progresoPorFase: {
        faseId: number;
        tituloFase: string;
        semanasEnFase: number;
        semanasCompletadas: number;
        porcentajeCompletado: number;
    }[];
}

export interface Phase {
    id: number;
    name: string;
    duration: string;
    focus: string;
    color: string;
    competencies: string[];
    months: string;
}

export interface CompetencyLevel {
    level: number;
    name: string;
    description: string;
    color: string;
    threshold: number;
}

export interface ModuleStats {
    totalModules: number;
    totalLessons: number;
    completedLessons: number;
    totalExercises: number;
    completedExercises: number;
    overallProgress: number;
}

export interface TestStats {
    total: number;
    passed: number;
    failed: number;
    duration: number;
}

export interface TestResults {
    timestamp: string;
    success: boolean;
    stats: TestStats;
}

export interface ExecutionDetails {
    command: string;
    exitCode: number;
    executionTime: number;
    clientExecutionTime: number;
}
