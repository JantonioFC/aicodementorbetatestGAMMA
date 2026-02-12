/**
 * ROUTER FEDERADO
 */
import { promises as fs } from 'fs';
import * as path from 'path';
import { logger } from '../observability/Logger';

export interface PhaseMapping {
    startWeek: number;
    endWeek: number;
    fileName: string;
}

export interface FederatedIndex {
    phaseMapping: PhaseMapping[];
}

export interface WeekData {
    numero: number;
    titulo: string;
    tituloSemana?: string; // Alias or specific property
    semana?: number;
    modulo?: number;
    tituloModulo?: string;
    objetivos?: string[];
    tematica?: string;
    actividades?: string[];
    entregables?: string;
    recursos?: Array<{ nombre: string; url: string }>;
    ejercicios?: Array<{ title: string; description: string; difficulty: string }>;
    [key: string]: unknown;
}

export interface ModuleData {
    numero: number;
    titulo: string;
    semanas: number[];
}

export interface PhaseData {
    fase: {
        numero: number;
        titulo: string;
    } | number | string;
    tituloFase?: string;
    semanas: WeekData[];
    modulos: ModuleData[];
}

export interface ExtendedWeekData extends WeekData {
    fase: number | string;
    tituloFase: string;
    sourceFile: string;
}

const FEDERATED_CONFIG = {
    INDEX_FILE: path.join(process.cwd(), 'data', 'federated', 'index.json'),
    FEDERATED_DIR: path.join(process.cwd(), 'data', 'federated'),
    CACHE_TTL: 5 * 60 * 1000 // 5 minutos
};

let indexCache: FederatedIndex | null = null;
let cacheTimestamp: number | null = null;

/**
 * Determina qué archivo de fase contiene los datos de una semana específica
 */
export async function findPhaseFile(weekId: number): Promise<string | null> {
    if (!weekId || typeof weekId !== 'number' || weekId < 1 || weekId > 100) {
        return null;
    }

    try {
        const indexData = await getIndexData();
        const mapping = indexData.phaseMapping.find((map: PhaseMapping) =>
            weekId >= map.startWeek && weekId <= map.endWeek
        );
        return mapping ? mapping.fileName : null;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error in findPhaseFile';
        logger.error('[FEDERATED] Error en findPhaseFile', { error: errorMessage });
        return null;
    }
}

export async function getIndexData(): Promise<FederatedIndex> {
    const now = Date.now();
    if (indexCache && cacheTimestamp && (now - cacheTimestamp) < FEDERATED_CONFIG.CACHE_TTL) {
        return indexCache;
    }

    try {
        const indexContent = await fs.readFile(FEDERATED_CONFIG.INDEX_FILE, 'utf8');
        const indexData = JSON.parse(indexContent) as FederatedIndex;
        indexCache = indexData;
        cacheTimestamp = now;
        return indexData;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error loading index.json';
        throw new Error(`Error cargando index.json: ${errorMessage}`);
    }
}

export async function loadPhaseData(phaseFileName: string): Promise<PhaseData> {
    try {
        const phaseFilePath = path.join(FEDERATED_CONFIG.FEDERATED_DIR, phaseFileName);
        const phaseContent = await fs.readFile(phaseFilePath, 'utf8');
        return JSON.parse(phaseContent) as PhaseData;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error loading phase file';
        throw new Error(`Error cargando archivo de fase ${phaseFileName}: ${errorMessage}`);
    }
}

export async function getWeekDataFederated(weekId: number): Promise<ExtendedWeekData | null> {
    try {
        const phaseFileName = await findPhaseFile(weekId);
        if (!phaseFileName) return null;

        const phaseData = await loadPhaseData(phaseFileName);
        const weekData = findWeekInPhase(phaseData, weekId);

        if (weekData) {
            let faseNum: number | string = 0;
            let faseTitulo = 'Fase sin título';

            if (typeof phaseData.fase === 'object' && phaseData.fase !== null && 'numero' in phaseData.fase) {
                faseNum = phaseData.fase.numero;
                faseTitulo = phaseData.fase.titulo || phaseData.tituloFase || 'Fase sin título';
            } else if (typeof phaseData.fase === 'number' || typeof phaseData.fase === 'string') {
                faseNum = phaseData.fase;
                faseTitulo = phaseData.tituloFase || 'Fase sin título';
            }

            return {
                ...weekData,
                fase: faseNum,
                tituloFase: faseTitulo,
                sourceFile: phaseFileName
            };
        }
        return null;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error in getWeekDataFederated';
        logger.error(`[FEDERATED] Error obteniendo datos de semana ${weekId}`, { error: errorMessage });
        return null;
    }
}

export function findWeekInPhase(phaseData: PhaseData, weekId: number): WeekData | null {
    for (const semana of phaseData.semanas || []) {
        if (semana.numero === weekId) {
            let moduloData: { modulo: number; tituloModulo: string } | null = null;
            for (const modulo of phaseData.modulos || []) {
                if (modulo.semanas && modulo.semanas.includes(weekId)) {
                    moduloData = { modulo: modulo.numero, tituloModulo: modulo.titulo };
                    break;
                }
            }
            return {
                ...semana,
                semana: semana.numero,
                ...(moduloData || { modulo: semana.modulo as number, tituloModulo: (semana.tituloModulo as string) || 'Módulo no especificado' })
            };
        }
    }
    return null;
}

export async function validateFederatedSystem(): Promise<boolean> {
    try {
        const indexData = await getIndexData();
        for (const mapping of indexData.phaseMapping) {
            const phaseFilePath = path.join(FEDERATED_CONFIG.FEDERATED_DIR, mapping.fileName);
            await fs.access(phaseFilePath);
        }
        return true;
    } catch (error) {
        return false;
    }
}
