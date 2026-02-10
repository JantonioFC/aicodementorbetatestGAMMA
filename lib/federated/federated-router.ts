/**
 * ROUTER FEDERADO
 */
import { promises as fs } from 'fs';
import * as path from 'path';

const FEDERATED_CONFIG = {
    INDEX_FILE: path.join(process.cwd(), 'data', 'federated', 'index.json'),
    FEDERATED_DIR: path.join(process.cwd(), 'data', 'federated'),
    CACHE_TTL: 5 * 60 * 1000 // 5 minutos
};

let indexCache: any = null;
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
        const mapping = indexData.phaseMapping.find((map: any) =>
            weekId >= map.startWeek && weekId <= map.endWeek
        );
        return mapping ? mapping.fileName : null;
    } catch (error: any) {
        console.error(`❌ [FEDERATED] Error en findPhaseFile:`, error.message);
        return null;
    }
}

export async function getIndexData(): Promise<any> {
    const now = Date.now();
    if (indexCache && cacheTimestamp && (now - cacheTimestamp) < FEDERATED_CONFIG.CACHE_TTL) {
        return indexCache;
    }

    try {
        const indexContent = await fs.readFile(FEDERATED_CONFIG.INDEX_FILE, 'utf8');
        const indexData = JSON.parse(indexContent);
        indexCache = indexData;
        cacheTimestamp = now;
        return indexData;
    } catch (error: any) {
        throw new Error(`Error cargando index.json: ${error.message}`);
    }
}

export async function loadPhaseData(phaseFileName: string): Promise<any> {
    try {
        const phaseFilePath = path.join(FEDERATED_CONFIG.FEDERATED_DIR, phaseFileName);
        const phaseContent = await fs.readFile(phaseFilePath, 'utf8');
        return JSON.parse(phaseContent);
    } catch (error: any) {
        throw new Error(`Error cargando archivo de fase ${phaseFileName}: ${error.message}`);
    }
}

export async function getWeekDataFederated(weekId: number): Promise<any> {
    try {
        const phaseFileName = await findPhaseFile(weekId);
        if (!phaseFileName) return null;

        const phaseData = await loadPhaseData(phaseFileName);
        const weekData = findWeekInPhase(phaseData, weekId);

        if (weekData) {
            return {
                ...weekData,
                fase: phaseData.fase?.numero || phaseData.fase || 0,
                tituloFase: phaseData.fase?.titulo || phaseData.tituloFase || 'Fase sin título',
                sourceFile: phaseFileName
            };
        }
        return null;
    } catch (error: any) {
        console.error(`❌ [FEDERATED] Error obteniendo datos de semana ${weekId}:`, error.message);
        return null;
    }
}

export function findWeekInPhase(phaseData: any, weekId: number): any {
    for (const semana of phaseData.semanas || []) {
        if (semana.numero === weekId) {
            let moduloData = null;
            for (const modulo of phaseData.modulos || []) {
                if (modulo.semanas && modulo.semanas.includes(weekId)) {
                    moduloData = { modulo: modulo.numero, tituloModulo: modulo.titulo };
                    break;
                }
            }
            return {
                ...semana,
                semana: semana.numero,
                ...(moduloData || { modulo: semana.modulo, tituloModulo: 'Módulo no especificado' })
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
