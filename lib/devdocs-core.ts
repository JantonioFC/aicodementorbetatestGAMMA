import { promises as fs } from 'fs';
import * as path from 'path';
import { logger } from './observability/Logger';

/**
 * DEVDOCS RETRIEVER - Sistema de Recuperación Autónomo para IRP
 */

export interface DevDocsMasterItem {
    slug: string;
    name: string;
    release?: string;
    mtime?: number;
}

export interface DevDocsEntry {
    name: string;
    path: string;
    type: string;
    fallback?: boolean;
}

export interface DevDocsTechnologyIndex {
    slug: string;
    name: string;
    entries: DevDocsEntry[];
    version: string;
    syncedAt: string;
    syncMethod: string;
    syncMetadata?: {
        syncMethod?: string;
    };
}

export interface DocumentationResult {
    entity: string;
    url: string;
    title: string;
    content: string;
    technology: string;
    retrievedAt: string;
    source: string;
    fallback: boolean;
}

// Cache en memoria para optimizar rendimiento local
interface LocalDataCache {
    masterIndex: DevDocsMasterItem[] | null;
    technologyIndexes: Map<string, { data: DevDocsTechnologyIndex; cachedAt: number }>;
    contentCache: Map<string, string>;
    lastLoaded: number | null;
    ttl: number;
}

const localDataCache: LocalDataCache = {
    masterIndex: null,
    technologyIndexes: new Map(),
    contentCache: new Map(),
    lastLoaded: null,
    ttl: 1000 * 60 * 60 // 1 hora TTL para datos locales
};

// Configuración de datos locales
const LOCAL_CONFIG = {
    dataDir: path.join(__dirname, '..', 'data', 'devdocs'),
    masterIndexPath: path.join(__dirname, '..', 'data', 'devdocs', 'master', 'docs.json'),
    technologiesDir: path.join(__dirname, '..', 'data', 'devdocs', 'technologies'),
    contentDir: path.join(__dirname, '..', 'data', 'devdocs', 'content'),
    fallbackUrl: 'https://devdocs.io', // Solo para URLs de referencia, NO para peticiones
};

/**
 * Obtiene el índice maestro desde archivo local
 */
export async function getMasterIndex(): Promise<DevDocsMasterItem[]> {
    if (localDataCache.masterIndex && localDataCache.lastLoaded) {
        const cacheAge = Date.now() - localDataCache.lastLoaded;
        if (cacheAge < localDataCache.ttl) {
            return localDataCache.masterIndex;
        }
    }

    try {
        const indexContent = await fs.readFile(LOCAL_CONFIG.masterIndexPath, 'utf8');
        const indexData = JSON.parse(indexContent);

        if (!Array.isArray(indexData)) {
            throw new Error('DEVDOCS-RETRIEVER-FORMAT: Índice maestro local no es un array válido');
        }

        localDataCache.masterIndex = indexData as DevDocsMasterItem[];
        localDataCache.lastLoaded = Date.now();

        return localDataCache.masterIndex;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error reading master index';
        logger.error('[DEVDOCS-RETRIEVER] Error leyendo índice maestro local', { error: errorMessage });
        throw error;
    }
}

/**
 * Encuentra tecnología y carga su índice desde archivos locales
 */
export async function getTechnologyIndex(technology: string): Promise<DevDocsTechnologyIndex> {
    if (!technology || typeof technology !== 'string' || technology.trim().length === 0) {
        throw new Error('DEVDOCS-RETRIEVER-INPUT: Tecnología debe ser una cadena no vacía');
    }

    const normalizedTech = technology.trim();

    if (localDataCache.technologyIndexes.has(normalizedTech)) {
        const cached = localDataCache.technologyIndexes.get(normalizedTech)!;
        if (Date.now() - cached.cachedAt < localDataCache.ttl) {
            return cached.data;
        }
    }

    const masterIndex = await getMasterIndex();
    const matchedDoc = findTechnologyInIndex(masterIndex, normalizedTech);

    if (!matchedDoc) {
        throw new Error(`DEVDOCS-RETRIEVER-NOT-FOUND: Tecnología "${normalizedTech}" no encontrada.`);
    }

    const techIndexPath = path.join(LOCAL_CONFIG.technologiesDir, `${matchedDoc.slug}.json`);

    try {
        const techContent = await fs.readFile(techIndexPath, 'utf8');
        const techIndex = JSON.parse(techContent) as DevDocsTechnologyIndex;

        const result: DevDocsTechnologyIndex = {
            slug: techIndex.slug || matchedDoc.slug,
            name: techIndex.name || matchedDoc.name,
            entries: techIndex.entries || [],
            version: techIndex.version || 'latest',
            syncedAt: techIndex.syncedAt || new Date().toISOString(),
            syncMethod: techIndex.syncMetadata?.syncMethod || 'official'
        };

        localDataCache.technologyIndexes.set(normalizedTech, {
            data: result,
            cachedAt: Date.now()
        });

        return result;
    } catch (error) {
        const fallbackIndex = generateFallbackTechnologyIndex(matchedDoc, normalizedTech);
        localDataCache.technologyIndexes.set(normalizedTech, {
            data: fallbackIndex,
            cachedAt: Date.now()
        });
        return fallbackIndex;
    }
}

/**
 * Función principal - Recupera documentación desde archivos locales
 */
export async function retrieveDocumentationForCode(codeSnippet: string, technology: string | null = null): Promise<DocumentationResult[]> {
    if (codeSnippet === undefined || codeSnippet === null || typeof codeSnippet !== 'string' || codeSnippet.trim().length === 0) {
        throw new Error('DEVDOCS-RETRIEVER-CODE-INPUT: Código debe ser una cadena no vacía');
    }

    const normalizedCode = codeSnippet.trim();
    const detectedTechnology = technology || detectTechnologyFromCode(normalizedCode);
    const entities = identifyCodeEntities(normalizedCode, detectedTechnology);

    if (entities.length === 0) return [];

    const techIndex = await getTechnologyIndex(detectedTechnology);
    const documentationResults: DocumentationResult[] = [];
    const maxEntities = Math.min(entities.length, 5);

    for (let i = 0; i < maxEntities; i++) {
        const entity = entities[i];
        try {
            const docEntry = findEntityInTechnologyIndex(entity, techIndex);
            let docContent: string;
            let source: string;
            let isFallback = false;

            if (docEntry) {
                docContent = await fetchLocalEntityDocumentation(entity, techIndex.slug);
                source = docEntry.fallback ? 'fallback-generated' : 'local-file';
                isFallback = docEntry.fallback || false;
            } else {
                docContent = generateFallbackDocumentation(entity, techIndex.slug);
                source = 'fallback-generated';
                isFallback = true;
            }

            documentationResults.push({
                entity,
                url: `${LOCAL_CONFIG.fallbackUrl}/${techIndex.slug}/${docEntry?.path || entity.toLowerCase()}`,
                title: docEntry?.name || entity,
                content: docContent,
                technology: techIndex.name,
                retrievedAt: new Date().toISOString(),
                source,
                fallback: isFallback
            });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error retrieving entity docs';
            logger.warn(`[DEVDOCS-RETRIEVER] Error for ${entity}`, { error: errorMessage });
        }
    }

    return documentationResults;
}

/**
 * FUNCIONES AUXILIARES
 */

function findTechnologyInIndex(masterIndex: DevDocsMasterItem[], technology: string): DevDocsMasterItem | undefined {
    const normalizedSearch = technology.toLowerCase();
    let match = masterIndex.find(doc => doc.name.toLowerCase() === normalizedSearch);
    if (match) return match;
    return masterIndex.find(doc => doc.name.toLowerCase().includes(normalizedSearch));
}

function detectTechnologyFromCode(code: string): string {
    if (/\bconst\b|\blet\b|\bvar\b/.test(code)) return 'JavaScript';
    if (/\bdef\b|\bclass\b|import\s/.test(code)) return 'Python';
    return 'JavaScript';
}

function identifyCodeEntities(code: string, technology: string): string[] {
    const entities = new Set<string>();
    if (technology === 'JavaScript') {
        const arrayMethods = code.match(/\.(map|filter|reduce|forEach|find|some|every)\(/g);
        arrayMethods?.forEach(m => entities.add(`Array.prototype.${m.slice(1, -1)}`));
    } else if (technology === 'Python') {
        const builtins = code.match(/\b(len|range|enumerate|zip|list|dict)\(/g);
        builtins?.forEach(b => entities.add(b.slice(0, -1)));
    }
    return Array.from(entities);
}

function findEntityInTechnologyIndex(entity: string, techIndex: DevDocsTechnologyIndex): DevDocsEntry | undefined {
    return techIndex.entries.find((entry: DevDocsEntry) => entry.name === entity || entry.name.includes(entity));
}

async function fetchLocalEntityDocumentation(entity: string, technologySlug: string): Promise<string> {
    const safeEntityName = entity.replace(/[^a-zA-Z0-9.-]/g, '_');
    const contentPath = path.join(LOCAL_CONFIG.contentDir, technologySlug, `${safeEntityName}.md`);

    try {
        const contentFile = await fs.readFile(contentPath, 'utf8');
        const contentData = JSON.parse(contentFile) as { content?: string };
        return contentData.content || generateFallbackDocumentation(entity, technologySlug);
    } catch {
        return generateFallbackDocumentation(entity, technologySlug);
    }
}

function generateFallbackDocumentation(entity: string, technologySlug: string): string {
    return `### ${entity}\n\nDocumentación básica para ${entity} en ${technologySlug}. (Modo Fallback)`;
}

export function generateFallbackTechnologyIndex(matchedDoc: DevDocsMasterItem, technologyName: string): DevDocsTechnologyIndex {
    return {
        slug: matchedDoc.slug,
        name: matchedDoc.name || technologyName,
        entries: [],
        version: 'fallback',
        syncedAt: new Date().toISOString(),
        syncMethod: 'fallback'
    };
}

export function detectTechnologyType(slug: string, name: string): string {
    const sn = (slug + name).toLowerCase();
    if (sn.includes('javascript')) return 'javascript';
    if (sn.includes('python')) return 'python';
    return 'generic';
}
