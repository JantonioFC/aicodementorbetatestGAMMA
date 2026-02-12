/**
 * MOTOR RAG CORE - retrieve_sources() + ARM EXTERNO + ARQUITECTURA FEDERADA
 */
import { enrichRAGWithExternalSources } from '../arm/external-retriever';
import type { getWeekDataFederated as getWeekDataFederatedType, ExtendedWeekData } from '../federated/federated-router';
import { logger } from '../observability/Logger';

// Configuración del sistema RAG
const RAG_CONFIG = {
    DATA_SOURCE: 'federated_system_v8.1.0',
    CONTEXT_VERSION: 'v8.1.0',
    SOURCE_AUTHORITY: 'data/federated/index.json + fase-N.json',
    MAX_PREREQUISITES: 3,
    PHASE_COUNT: 8 // Fases 0-7
};


// Interfaces para el sistema RAG
export interface RAGResource {
    title: string;
    url?: string;
    type?: string;
}

export interface RAGExercise {
    title: string;
    description?: string;
    difficulty?: string;
}

export interface RAGPrerequisite {
    weekId: number;
    title: string;
    keyTopics: string[];
}

export interface ExternalSource {
    title: string;
    url: string;
    snippet?: string;
}

export interface RAGContext {
    weekId: number;
    weekTitle: string;
    phase: number;
    phaseTitle: string;
    module: number;
    moduleTitle: string;
    objectives: string[];
    mainTopic: string;
    activities: string[];
    deliverables: string;
    resources: RAGResource[];
    exercises: RAGExercise[];
    pedagogicalApproach: string;
    difficultyLevel: string;
    prerequisites: RAGPrerequisite[];
    retrievalTimestamp: string;
    sourceAuthority: string;
    contextVersion: string;
    externalSources?: ExternalSource[];
    armStatus?: string;
    armError?: string;
}

/**
 * FUNCIÓN PRINCIPAL DEL MOTOR RAG + ARM EXTERNO
 */
export async function retrieve_sources(weekId: number, includeExternalSources: boolean = true): Promise<RAGContext> {
    // VALIDACIÓN DE ENTRADA
    if (!weekId || typeof weekId !== 'number' || weekId < 1 || weekId > 100) {
        throw new Error(`WeekId inválido: ${weekId}. Debe estar entre 1-100.`);
    }

    logger.info('RAG federated retrieving week data', { weekId });

    // Import dinámico para compatibilidad (evitar ciclos y persistir arquitectura de carga bajo demanda)
    const { getWeekDataFederated } = await import('../federated/federated-router') as { getWeekDataFederated: typeof getWeekDataFederatedType };
    const weekData = await getWeekDataFederated(weekId) as ExtendedWeekData | null;

    if (!weekData) {
        throw new Error(`Semana ${weekId} no encontrada en sistema federado`);
    }

    logger.info('RAG federated week loaded', { weekId, sourceFile: weekData.sourceFile });

    // ENRIQUECIMIENTO CONTEXTUAL BÁSICO
    const phaseValue = typeof weekData.fase === 'number' ? weekData.fase : parseInt(String(weekData.fase), 10) || 0;

    const basicContext: RAGContext = {
        weekId: weekId,
        weekTitle: weekData.tituloSemana || weekData.titulo,
        phase: phaseValue,
        phaseTitle: weekData.tituloFase || '',
        module: weekData.modulo || 0,
        moduleTitle: weekData.tituloModulo || '',
        objectives: Array.isArray(weekData.objetivos) ? weekData.objetivos : [],
        mainTopic: typeof weekData.tematica === 'string' ? weekData.tematica : '',
        activities: Array.isArray(weekData.actividades) ? weekData.actividades : [],
        deliverables: typeof weekData.entregables === 'string' ? weekData.entregables : '',
        resources: (Array.isArray(weekData.recursos) ? weekData.recursos : []).map(r => ({
            title: r.nombre || 'Sin título',
            url: r.url
        })) as RAGResource[],
        exercises: (Array.isArray(weekData.ejercicios) ? weekData.ejercicios : []) as RAGExercise[],
        pedagogicalApproach: determinePedagogicalApproach(phaseValue),
        difficultyLevel: calculateDifficultyLevel(weekId, phaseValue),
        prerequisites: await getPrerequisites(weekId),
        retrievalTimestamp: new Date().toISOString(),
        sourceAuthority: RAG_CONFIG.SOURCE_AUTHORITY,
        contextVersion: RAG_CONFIG.CONTEXT_VERSION
    };

    // ENRIQUECIMIENTO CON ARM EXTERNO
    if (includeExternalSources) {
        try {
            logger.info('RAG+ARM enriching context with external sources');
            const enrichedContext = await enrichRAGWithExternalSources(basicContext);
            logger.info('RAG+ARM context enriched', { externalSourceCount: enrichedContext.externalSources?.length || 0 });
            return enrichedContext;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error('RAG+ARM external ARM error', { error: message });
            logger.warn('RAG+ARM falling back to basic context without external sources');
            return {
                ...basicContext,
                externalSources: [],
                armStatus: 'error',
                armError: message
            };
        }
    }

    return basicContext;
}

/**
 * Determina el enfoque pedagógico según la fase curricular
 */
export function determinePedagogicalApproach(phase: number): string {
    const approaches: Record<number, string> = {
        0: "Cimentación y Fundamentos",
        1: "Programación Estructurada",
        2: "Desarrollo Frontend",
        3: "Arquitectura Backend",
        4: "Operaciones y Escalabilidad",
        5: "Ciencia de Datos",
        6: "Integración Professional",
        7: "Crecimiento Continuo"
    };
    return approaches[phase] || "Enfoque General";
}

/**
 * Calcula el nivel de dificultad basado en progresión curricular
 */
export function calculateDifficultyLevel(weekId: number, phase: number): string {
    if (weekId <= 20) return "Básico";
    if (weekId <= 50) return "Intermedio";
    if (weekId <= 80) return "Avanzado";
    return "Experto";
}

/**
 * Obtiene las semanas prerequisite para una semana dada usando sistema federado
 */
export async function getPrerequisites(weekId: number): Promise<RAGPrerequisite[]> {
    if (weekId <= 1) return [];

    const prerequisites: RAGPrerequisite[] = [];
    const startWeek = Math.max(1, weekId - RAG_CONFIG.MAX_PREREQUISITES);

    const { getWeekDataFederated } = await import('../federated/federated-router') as { getWeekDataFederated: typeof getWeekDataFederatedType };
    const getWeekData = getWeekDataFederated;

    for (let i = startWeek; i < weekId; i++) {
        try {
            const prevWeek = await getWeekData(i) as ExtendedWeekData | null;
            if (prevWeek) {
                prerequisites.push({
                    weekId: i,
                    title: prevWeek.tituloSemana || prevWeek.titulo,
                    keyTopics: Array.isArray(prevWeek.objetivos) ? prevWeek.objetivos.slice(0, 2) : []
                });
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            logger.warn('RAG federated could not load prerequisite week', { weekId: i, error: message });
        }
    }

    return prerequisites;
}

// Funciones deprecadas mantenidas para compatibilidad
export async function getCurriculumData(): Promise<never> {
    throw new Error('DEPRECATED: getCurriculumData() ha sido reemplazada por sistema federado. Usar getWeekDataFederated().');
}

export function findWeekInCurriculum(): never {
    throw new Error('DEPRECATED: findWeekInCurriculum() ha sido reemplazada por sistema federado. Usar getWeekDataFederated().');
}
