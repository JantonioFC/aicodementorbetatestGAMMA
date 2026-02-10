/**
 * MOTOR RAG CORE - retrieve_sources() + ARM EXTERNO + ARQUITECTURA FEDERADA
 */
import { enrichRAGWithExternalSources } from '../arm/external-retriever';

// Configuración del sistema RAG
const RAG_CONFIG = {
    DATA_SOURCE: 'federated_system_v8.1.0',
    CONTEXT_VERSION: 'v8.1.0',
    SOURCE_AUTHORITY: 'data/federated/index.json + fase-N.json',
    MAX_PREREQUISITES: 3,
    PHASE_COUNT: 8 // Fases 0-7
};

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
    resources: any[];
    exercises: any[];
    pedagogicalApproach: string;
    difficultyLevel: string;
    prerequisites: any[];
    retrievalTimestamp: string;
    sourceAuthority: string;
    contextVersion: string;
    externalSources?: any[];
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

    console.log(`🚀 [RAG FEDERADO] Recuperando datos para semana ${weekId} usando arquitectura federada...`);

    // Import dinámico para compatibilidad (permitir que el router federado se migre después si es necesario)
    const { getWeekDataFederated } = await import('../federated/federated-router' as any);
    const weekData = await (getWeekDataFederated as any)(weekId);

    if (!weekData) {
        throw new Error(`Semana ${weekId} no encontrada en sistema federado`);
    }

    console.log(`✅ [RAG FEDERADO] Semana ${weekId} cargada desde ${weekData.sourceFile}`);

    // ENRIQUECIMIENTO CONTEXTUAL BÁSICO
    const basicContext: RAGContext = {
        weekId: weekId,
        weekTitle: weekData.tituloSemana,
        phase: weekData.fase,
        phaseTitle: weekData.tituloFase,
        module: weekData.modulo,
        moduleTitle: weekData.tituloModulo,
        objectives: weekData.objetivos || [],
        mainTopic: weekData.tematica || '',
        activities: weekData.actividades || [],
        deliverables: weekData.entregables || '',
        resources: weekData.recursos || [],
        exercises: weekData.ejercicios || [],
        pedagogicalApproach: determinePedagogicalApproach(weekData.fase),
        difficultyLevel: calculateDifficultyLevel(weekId, weekData.fase),
        prerequisites: await getPrerequisites(weekId),
        retrievalTimestamp: new Date().toISOString(),
        sourceAuthority: RAG_CONFIG.SOURCE_AUTHORITY,
        contextVersion: RAG_CONFIG.CONTEXT_VERSION
    };

    // ENRIQUECIMIENTO CON ARM EXTERNO
    if (includeExternalSources) {
        try {
            console.log(`🚀 [RAG+ARM] Enriqueciendo contexto con fuentes externas...`);
            const enrichedContext = await enrichRAGWithExternalSources(basicContext);
            console.log(`✅ [RAG+ARM] Contexto enriquecido: ${enrichedContext.externalSources?.length || 0} fuentes externas`);
            return enrichedContext;
        } catch (armError: any) {
            console.error(`❌ [RAG+ARM] Error en ARM externo: ${armError.message}`);
            console.warn(`🔄 [RAG+ARM] Fallback: Devolviendo contexto básico sin fuentes externas`);
            return {
                ...basicContext,
                externalSources: [],
                armStatus: 'error',
                armError: armError.message
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
export async function getPrerequisites(weekId: number): Promise<any[]> {
    if (weekId <= 1) return [];

    const prerequisites: any[] = [];
    const startWeek = Math.max(1, weekId - RAG_CONFIG.MAX_PREREQUISITES);

    const { getWeekDataFederated } = await import('../federated/federated-router' as any);

    for (let i = startWeek; i < weekId; i++) {
        try {
            const prevWeek = await (getWeekDataFederated as any)(i);
            if (prevWeek) {
                prerequisites.push({
                    weekId: i,
                    title: prevWeek.tituloSemana,
                    keyTopics: prevWeek.objetivos ? prevWeek.objetivos.slice(0, 2) : []
                });
            }
        } catch (error: any) {
            console.warn(`⚠️ [RAG FEDERADO] No se pudo cargar prerequisito semana ${i}:`, error.message);
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
