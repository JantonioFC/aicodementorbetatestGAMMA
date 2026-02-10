
/**
 * Auto-Discovery de Modelos Google AI
 * Detecta automáticamente modelos disponibles via API
 * 
 * @module lib/ai/discovery/ModelDiscovery
 */

import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'lib', 'ai', 'config', 'models.json');
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 horas

export interface DiscoveredModel {
    name: string;
    displayName: string;
    description: string;
    inputTokenLimit: number;
    outputTokenLimit: number;
    supportedGenerationMethods: string[];
    priority: number;
    discoveredAt?: string;
}

interface FileCache {
    lastUpdated: string;
    models: DiscoveredModel[];
    cacheValidUntil: string;
}

/**
 * Modelos conocidos con sus capacidades
 * Usado como fallback si la API no responde
 */
const KNOWN_MODELS: DiscoveredModel[] = [
    {
        name: 'gemini-2.5-flash',
        displayName: 'Gemini 2.5 Flash',
        description: 'Modelo estable y rápido para análisis',
        inputTokenLimit: 1048576,
        outputTokenLimit: 65536,
        supportedGenerationMethods: ['generateContent'],
        priority: 1
    },
    {
        name: 'gemini-2.5-pro',
        displayName: 'Gemini 2.5 Pro',
        description: 'Modelo más capaz para análisis complejos',
        inputTokenLimit: 1048576,
        outputTokenLimit: 65536,
        supportedGenerationMethods: ['generateContent'],
        priority: 2
    },
    {
        name: 'gemini-2.0-flash',
        displayName: 'Gemini 2.0 Flash',
        description: 'Modelo rápido y eficiente',
        inputTokenLimit: 1048576,
        outputTokenLimit: 8192,
        supportedGenerationMethods: ['generateContent'],
        priority: 3
    }
];

export class ModelDiscovery {
    private apiKey: string;
    private baseUrl: string;
    private cache: DiscoveredModel[] | null;
    private lastDiscovery: Date | null;

    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY || '';
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
        this.cache = null;
        this.lastDiscovery = null;
    }

    /**
     * Descubrir modelos disponibles
     * @param {boolean} forceRefresh - Forzar actualización ignorando cache
     */
    async discover(forceRefresh = false): Promise<DiscoveredModel[]> {
        // Verificar cache en memoria
        if (!forceRefresh && this.cache && this.isCacheValid()) {
            console.log('[ModelDiscovery] Usando cache en memoria');
            return this.cache;
        }

        // Verificar cache en archivo
        const fileCache = this.loadFromFile();
        if (!forceRefresh && fileCache && this.isFileCacheValid(fileCache)) {
            console.log('[ModelDiscovery] Usando cache de archivo');
            this.cache = fileCache.models;
            this.lastDiscovery = new Date(fileCache.lastUpdated);
            return this.cache;
        }

        // Descubrir via API
        try {
            const models = await this.fetchFromAPI();
            this.cache = models;
            this.lastDiscovery = new Date();
            this.saveToFile(models);
            console.log(`[ModelDiscovery] Descubiertos ${models.length} modelos via API`);
            return models;
        } catch (error: any) {
            console.error('[ModelDiscovery] Error consultando API:', error.message);
            // Usar modelos conocidos como fallback
            console.log('[ModelDiscovery] Usando modelos conocidos como fallback');
            return KNOWN_MODELS;
        }
    }

    /**
     * Consultar la API de Google AI para obtener modelos
     */
    async fetchFromAPI(): Promise<DiscoveredModel[]> {
        if (!this.apiKey) {
            throw new Error('GEMINI_API_KEY no configurada');
        }

        const url = `${this.baseUrl}/models?key=${this.apiKey}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        const excludePatterns = ['tts', 'robotics', 'computer-use', 'image', 'lite'];

        const generativeModels = (data.models || [])
            .filter((model: any) =>
                model.supportedGenerationMethods?.includes('generateContent') &&
                model.name?.includes('gemini') &&
                !excludePatterns.some(pattern => model.name?.toLowerCase().includes(pattern))
            )
            .map((model: any) => ({
                name: model.name?.replace('models/', '') || model.name,
                displayName: model.displayName || model.name,
                description: model.description || '',
                inputTokenLimit: model.inputTokenLimit || 0,
                outputTokenLimit: model.outputTokenLimit || 0,
                supportedGenerationMethods: model.supportedGenerationMethods || [],
                priority: this.calculatePriority(model.name),
                discoveredAt: new Date().toISOString()
            }))
            .sort((a: DiscoveredModel, b: DiscoveredModel) => a.priority - b.priority)
            .slice(0, 5);

        return generativeModels.length > 0 ? generativeModels : KNOWN_MODELS;
    }

    calculatePriority(modelName: string): number {
        if (modelName?.includes('2.5-flash')) return 1;
        if (modelName?.includes('2.5-pro')) return 2;
        if (modelName?.includes('2.0-flash')) return 3;
        if (modelName?.includes('2.0')) return 4;
        if (modelName?.includes('pro')) return 5;
        if (modelName?.includes('flash')) return 6;
        return 10;
    }

    isCacheValid(): boolean {
        if (!this.lastDiscovery) return false;
        const elapsed = Date.now() - this.lastDiscovery.getTime();
        return elapsed < CACHE_DURATION_MS;
    }

    isFileCacheValid(fileCache: FileCache): boolean {
        if (!fileCache?.lastUpdated) return false;
        const elapsed = Date.now() - new Date(fileCache.lastUpdated).getTime();
        return elapsed < CACHE_DURATION_MS;
    }

    loadFromFile(): FileCache | null {
        if (typeof window !== 'undefined') return null;

        try {
            if (fs.existsSync(CONFIG_PATH)) {
                const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
                return JSON.parse(content) as FileCache;
            }
        } catch (error: any) {
            console.warn('[ModelDiscovery] Error leyendo cache:', error.message);
        }
        return null;
    }

    saveToFile(models: DiscoveredModel[]): void {
        if (typeof window !== 'undefined') return;

        try {
            const dir = path.dirname(CONFIG_PATH);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const data: FileCache = {
                lastUpdated: new Date().toISOString(),
                models: models,
                cacheValidUntil: new Date(Date.now() + CACHE_DURATION_MS).toISOString()
            };

            fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2));
            console.log(`[ModelDiscovery] Cache guardado en ${CONFIG_PATH}`);
        } catch (error: any) {
            console.error('[ModelDiscovery] Error guardando cache:', error.message);
        }
    }

    async getPrimaryModel(): Promise<DiscoveredModel | null> {
        const models = await this.discover();
        return models.length > 0 ? models[0] : null;
    }

    async getFallbackModel(excludeModel: string): Promise<DiscoveredModel | null> {
        const models = await this.discover();
        return models.find(m => m.name !== excludeModel) || null;
    }

    async isModelAvailable(modelName: string): Promise<boolean> {
        const models = await this.discover();
        return models.some(m => m.name === modelName || m.name.includes(modelName));
    }

    async refresh(): Promise<DiscoveredModel[]> {
        return this.discover(true);
    }
}

export const modelDiscovery = new ModelDiscovery();
