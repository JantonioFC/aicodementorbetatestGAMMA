
/**
 * Router de IA Google con Fallback Automático
 * Orquesta modelos Gemini con reintentos y cache
 * 
 * @module lib/ai/router/GeminiRouter
 */

import { ProviderFactory } from '../providers/ProviderFactory';
import { modelDiscovery, DiscoveredModel } from '../discovery/ModelDiscovery';
import { logger } from '../../observability/Logger';
import {
    handleAIError,
    AllModelsFailedError,
    getUserFriendlyMessage
} from '../../utils/errorHandler';
import { AppError } from '../../utils/AppError';
import { AIProvider, AnalysisRequest, AnalysisResponse } from '../providers/BaseProvider';

/**
 * Configuración de Circuit Breaker
 */
const CIRCUIT_CONFIG = {
    failureThreshold: 3, // Número de fallos para abrir circuito
    resetTimeoutMs: 30000 // Tiempo de espera (30s) antes de reintentar
};

/**
 * Configuración de Reintentos con Backoff Exponencial
 */
interface RetryConfig {
    maxRetries: number;
    baseDelayMs: number;
    maxDelayMs: number;
}

const RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,     // Máximo 3 reintentos
    baseDelayMs: 1000,  // Delay base de 1 segundo
    maxDelayMs: 10000   // Delay máximo de 10 segundos
};

interface CircuitState {
    failures: number;
    nextTry: number;
    state: 'CLOSED' | 'OPEN' | 'HALF-OPEN';
}

interface CacheEntry {
    data: AnalysisResponse;
    expiresAt: number;
}

/**
 * Router principal de IA Google (Smart Router)
 */
export class GeminiRouter {
    private providers: Map<string, AIProvider>;
    private cache: Map<string, CacheEntry>;
    private cacheExpiryMs: number;
    private circuitState: Map<string, CircuitState>;

    constructor() {
        this.providers = new Map();
        this.cache = new Map();
        this.cacheExpiryMs = 60 * 60 * 1000; // 1 hora
        this.circuitState = new Map();
    }

    /**
     * Inicializar el router con modelos disponibles
     */
    async initialize(): Promise<DiscoveredModel[]> {
        const models = await modelDiscovery.discover();

        for (const model of models) {
            if (!this.providers.has(model.name)) {
                // Use Factory to create proper provider
                const provider = ProviderFactory.getProvider('gemini', { modelName: model.name });
                this.providers.set(model.name, provider);

                // Inicializar estado de circuito
                this.circuitState.set(model.name, {
                    failures: 0,
                    nextTry: 0,
                    state: 'CLOSED'
                });
            }
        }

        logger.info(`[GeminiRouter] Inicializado con ${this.providers.size} modelos`);
        return models;
    }

    /**
     * Punto de entrada principal para análisis de código
     */
    async analyze(request: AnalysisRequest): Promise<AnalysisResponse> {
        const { code, language, phase, messages } = request;

        // Verificar cache
        const cacheKey = this.generateCacheKey(code, language, phase, messages);
        const cachedResult = this.getFromCache(cacheKey);
        if (cachedResult) {
            logger.info('[GeminiRouter] Respuesta obtenida de cache');
            logger.logSuccess({
                model: cachedResult.metadata.model,
                phase: phase || 'unknown',
                language: language || 'unknown',
                latency: 0,
                cacheHit: true
            });
            return cachedResult;
        }

        // Obtener modelos disponibles ordenados por prioridad
        const models = await modelDiscovery.discover();
        const modelsToTry = models.map(m => m.name);
        const errors: Array<{ model: string; error: string }> = [];
        let circuitBreakerTrippedFor = 0;

        // Intentar con cada modelo
        for (const modelName of modelsToTry) {
            // Verificar estado del Circuito
            const circuit = this.getCircuitState(modelName);
            const now = Date.now();

            if (circuit.state === 'OPEN') {
                if (now < circuit.nextTry) {
                    // Circuito abierto, saltar modelo (Fail Fast)
                    logger.warn(`[GeminiRouter] Circuito ABIERTO para ${modelName}. Saltando...`);
                    circuitBreakerTrippedFor++;
                    continue;
                } else {
                    // Tiempo cumplido, probar (Half-Open)
                    logger.info(`[GeminiRouter] Circuito HALF-OPEN para ${modelName}. Probando...`);
                    circuit.state = 'HALF-OPEN';
                }
            }

            try {
                const result = await this.tryModel(modelName, request);

                // Éxito - Cerrar circuito y guardar cache
                this.resetCircuit(modelName);
                this.setCache(cacheKey, result);

                logger.logSuccess({
                    model: modelName,
                    phase: phase || 'unknown',
                    language: language || 'unknown',
                    tokensUsed: result.metadata.tokensUsed,
                    latency: result.metadata.latency,
                    cacheHit: false
                });

                return result;

            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : String(error);
                logger.warn(`[GeminiRouter] ${modelName} falló: ${message}`);
                errors.push({ model: modelName, error: message });

                // Registrar fallo en circuito
                this.recordFailure(modelName);

                // Continuar con siguiente modelo
                continue;
            }
        }

        // Todos los modelos fallaron
        const finalError = new AllModelsFailedError(modelsToTry, errors);

        logger.logError({
            model: modelsToTry.join(', '),
            error: finalError.message,
            attemptedModels: modelsToTry,
            severity: 'critical',
            circuitBreakers: circuitBreakerTrippedFor
        });

        throw finalError;
    }

    private getCircuitState(modelName: string): CircuitState {
        if (!this.circuitState.has(modelName)) {
            this.circuitState.set(modelName, { failures: 0, nextTry: 0, state: 'CLOSED' });
        }
        return this.circuitState.get(modelName)!;
    }

    private recordFailure(modelName: string): void {
        const circuit = this.getCircuitState(modelName);
        circuit.failures++;

        if (circuit.failures >= CIRCUIT_CONFIG.failureThreshold) {
            circuit.state = 'OPEN';
            circuit.nextTry = Date.now() + CIRCUIT_CONFIG.resetTimeoutMs;
            logger.error(`💥 [GeminiRouter] Circuito ABIERTO para ${modelName} por ${CIRCUIT_CONFIG.resetTimeoutMs}ms`);
        }
    }

    private resetCircuit(modelName: string): void {
        const circuit = this.getCircuitState(modelName);
        if (circuit.failures > 0 || circuit.state !== 'CLOSED') {
            logger.info(`✅ [GeminiRouter] Circuito CERRADO/Restaurado para ${modelName}`);
            circuit.failures = 0;
            circuit.state = 'CLOSED';
            circuit.nextTry = 0;
        }
    }

    /**
     * Intentar análisis con un modelo específico
     */
    async tryModel(modelName: string, request: AnalysisRequest): Promise<AnalysisResponse> {
        let provider = this.providers.get(modelName);

        if (!provider) {
            provider = ProviderFactory.getProvider('gemini', { modelName });
            this.providers.set(modelName, provider);
        }

        if (!provider.isAvailable()) {
            throw new Error(`Modelo ${modelName} no disponible (API key faltante)`);
        }

        // Ejecutar con reintentos
        return this.retryWithBackoff(
            () => provider!.analyze(request),
            RETRY_CONFIG
        );
    }

    /**
     * Ejecutar función con reintentos y backoff exponencial
     */
    async retryWithBackoff<T>(fn: () => Promise<T>, config: RetryConfig): Promise<T> {
        const { maxRetries, baseDelayMs, maxDelayMs } = config;
        let lastError: unknown;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error: unknown) {
                lastError = error;
                const message = error instanceof Error ? error.message : String(error);

                // No reintentar errores de rate limit
                if (message.includes('rate limit') || message.includes('429')) {
                    throw error;
                }

                // Calcular delay con backoff exponencial + jitter
                const delay = Math.min(
                    baseDelayMs * Math.pow(2, attempt) + Math.random() * 1000,
                    maxDelayMs
                );

                logger.info(`[GeminiRouter] Reintento ${attempt + 1}/${maxRetries} en ${delay}ms`);
                await this.sleep(delay);
            }
        }

        throw lastError;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private generateCacheKey(code?: string, language?: string, phase?: string, messages?: Array<{ role: string; content: string }>): string {
        // Hash simple del código + parámetros + mensajes
        let content = `${code}-${language}-${phase}`;

        if (messages && messages.length > 0) {
            content += JSON.stringify(messages);
        }

        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return `cache_${Math.abs(hash).toString(16)}`;
    }

    private getFromCache(key: string): AnalysisResponse | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        // Verificar expiración
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    private setCache(key: string, data: AnalysisResponse): void {
        this.cache.set(key, {
            data,
            expiresAt: Date.now() + this.cacheExpiryMs
        });

        // Limpiar cache antiguo (máximo 100 entradas)
        if (this.cache.size > 100) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) this.cache.delete(firstKey);
        }
    }

    clearCache(): void {
        this.cache.clear();
        logger.info('[GeminiRouter] Cache limpiado');
    }

    getStats(): {
        loadedProviders: string[];
        cacheSize: number;
        cacheExpiryMs: number;
        circuits: Record<string, string>;
    } {
        // Mapear estado de circuitos para la UI/Logs
        const circuits = Object.fromEntries(
            Array.from(this.circuitState.entries()).map(([k, v]) => [k, v.state])
        );

        return {
            loadedProviders: Array.from(this.providers.keys()),
            cacheSize: this.cache.size,
            cacheExpiryMs: this.cacheExpiryMs,
            circuits
        };
    }
}

// Exportar instancia singleton
export const geminiRouter = new GeminiRouter();
