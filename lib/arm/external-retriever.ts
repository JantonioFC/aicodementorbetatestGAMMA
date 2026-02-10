/**
 * ARM (MÓDULO DE RECUPERACIÓN ACTIVA) - EXTENSIONES EXTERNAS
 * Integración con Motor RAG para fuentes de verdad externas.
 */
import * as fs from 'fs';
import * as path from 'path';

export interface ARMConfig {
    FETCH_TIMEOUT: number;
    RETRY_ATTEMPTS: number;
    RETRY_DELAY: number;
    CACHE_TTL_HOURS: number;
    MAX_CONTENT_SIZE: number;
    USER_AGENT: string;
    CACHE_FILE: string;
}

export const ARM_CONFIG: ARMConfig = {
    FETCH_TIMEOUT: 5000,
    RETRY_ATTEMPTS: 2,
    RETRY_DELAY: 1000,
    CACHE_TTL_HOURS: 24,
    MAX_CONTENT_SIZE: 1024 * 1024,
    USER_AGENT: 'AI Code Mentor ARM/1.0 (Educational Content Retriever; +https://github.com/ecosistema360)',
    CACHE_FILE: path.join(process.cwd(), 'db', 'content_cache.json')
};

// Asegurar que el directorio de la base de datos existe
const dbDir = path.dirname(ARM_CONFIG.CACHE_FILE);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

export interface FallbackContent {
    type: string;
    name: string;
    content: string;
    extractionMetadata: {
        contentLength: number;
        extractedAt: string;
        quality: string;
        source: string;
    };
}

const FALLBACK_CONTENT_DATABASE: Record<string, FallbackContent> = {
    'https://ai.google/responsibility/principles/': {
        type: 'ai-principles',
        name: 'Principios de IA Responsable de Google',
        content: `Los 7 Principios de IA Responsable de Google:
1. IA debe ser socialmente beneficiosa.
2. Evitar crear o reforzar sesgos injustos.
3. Ser construida y probada para seguridad.
4. Ser responsable ante las personas.
5. Incorporar principios de diseño de privacidad.
6. Mantener altos estándares de excelencia científica.
7. Estar disponible para usos que estén de acuerdo con estos principios.`,
        extractionMetadata: {
            contentLength: 450,
            extractedAt: '2025-09-18T21:00:00.000Z',
            quality: 'curated-high',
            source: 'internal-fallback'
        }
    }
};

/**
 * Recuperador robusto de HTML.
 */
export async function fetchRawHTML(url: string): Promise<string> {
    console.log(`🔄 [ARM RECUPERADOR] Iniciando descarga: ${url}`);

    try {
        new URL(url);
    } catch {
        throw new Error(`URL inválida: ${url}`);
    }

    let lastError: any = null;

    for (let attempt = 1; attempt <= ARM_CONFIG.RETRY_ATTEMPTS; attempt++) {
        try {
            console.log(`   📡 Intento ${attempt}/${ARM_CONFIG.RETRY_ATTEMPTS}...`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), ARM_CONFIG.FETCH_TIMEOUT);

            const response = await fetch(url, {
                headers: {
                    'User-Agent': ARM_CONFIG.USER_AGENT,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                },
                signal: controller.signal,
                redirect: 'follow',
                method: 'GET'
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                if (response.status >= 400 && response.status < 500) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText} - No reintentar`);
                } else if (response.status >= 500) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText} - Error servidor`);
                }
            }

            const html = await response.text();

            if (!html || html.trim().length === 0) {
                throw new Error('Contenido vacío recibido');
            }

            if (html.length > ARM_CONFIG.MAX_CONTENT_SIZE) {
                throw new Error(`Contenido demasiado grande: ${html.length} bytes`);
            }

            return html;

        } catch (error: any) {
            lastError = error;
            if (error.name === 'AbortError') {
                console.log(`   ⏰ Timeout en intento ${attempt}`);
            } else if (error.message.includes('No reintentar')) {
                break;
            }
            if (attempt < ARM_CONFIG.RETRY_ATTEMPTS) {
                const delay = ARM_CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw new Error(`Fallo tras ${ARM_CONFIG.RETRY_ATTEMPTS} intentos: ${lastError?.message}`);
}

/**
 * Extractor de contenido pedagógico.
 */
export async function extractMainContent(html: string, url: string): Promise<string> {
    try {
        const cleaned = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        if (cleaned.length < 50) {
            throw new Error("Contenido extraído insuficiente");
        }

        return cleaned.substring(0, 5000); // Límite razonable para prompt
    } catch (error: any) {
        throw new Error(`Error en extracción: ${error.message}`);
    }
}

function readCacheFile(): any {
    try {
        if (!fs.existsSync(ARM_CONFIG.CACHE_FILE)) return {};
        return JSON.parse(fs.readFileSync(ARM_CONFIG.CACHE_FILE, 'utf8'));
    } catch {
        return {};
    }
}

export async function getCachedContent(url: string): Promise<string | null> {
    const cache = readCacheFile();
    const entry = cache[url];
    if (!entry) return null;

    const age = (Date.now() - new Date(entry.last_fetched_at).getTime()) / 3600000;
    return age > ARM_CONFIG.CACHE_TTL_HOURS ? null : entry.content;
}

export async function setCachedContent(url: string, content: string): Promise<void> {
    const cache = readCacheFile();
    const now = new Date();
    cache[url] = {
        content,
        last_fetched_at: now.toISOString(),
        expires_at: new Date(now.getTime() + (ARM_CONFIG.CACHE_TTL_HOURS * 3600000)).toISOString()
    };
    fs.writeFileSync(ARM_CONFIG.CACHE_FILE, JSON.stringify(cache, null, 2));
}

export async function processExternalURL(url: string) {
    const startTime = Date.now();
    try {
        const cached = await getCachedContent(url);
        if (cached) return { url, content: cached, fromCache: true, status: 'success' };

        const html = await fetchRawHTML(url);
        const content = await extractMainContent(html, url);
        await setCachedContent(url, content);

        return {
            url,
            content,
            fromCache: false,
            status: 'success',
            processTimeMs: Date.now() - startTime
        };
    } catch (error: any) {
        return { url, content: null, status: 'error', error: error.message };
    }
}

export async function enrichRAGWithExternalSources(ragContext: any): Promise<any> {
    const urls: any[] = [];
    if (ragContext.resources) {
        ragContext.resources.forEach((r: any) => {
            if (r.url?.startsWith('http')) urls.push({ url: r.url, type: 'resource', name: r.nombre });
        });
    }

    if (urls.length === 0) return { ...ragContext, externalSources: [], armStatus: 'no-sources' };

    const externalSources: any[] = [];
    for (const u of urls) {
        const result = await processExternalURL(u.url);
        if (result.status === 'success') {
            externalSources.push({ ...result, type: u.type, name: u.name });
        } else {
            const fallback = FALLBACK_CONTENT_DATABASE[u.url];
            if (fallback) {
                externalSources.push({
                    url: u.url,
                    content: fallback.content,
                    status: 'fallback-success',
                    type: u.type,
                    name: u.name
                });
            }
        }
    }

    return { ...ragContext, externalSources, armStatus: 'enriched' };
}
