export interface Week {
    semana: number;
    tituloSemana: string;
    tematica: string;
}

export interface Module {
    modulo: number;
    tituloModulo: string;
    weeks: Week[];
}

export interface Phase {
    fase: number;
    tituloFase: string;
    duracionMeses: string;
    proposito: string;
}

export interface CurriculumSummary {
    curriculum: Phase[];
    totalPhases: number;
    metadata?: {
        lazyLoading?: {
            enabled: boolean;
        };
    };
}
