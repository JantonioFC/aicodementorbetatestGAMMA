/**
 * Tracer - Sistema de trazabilidad de requests
 * Permite debugging y análisis de rendimiento.
 */
import { v4 as uuidv4 } from 'uuid';
import { logger } from './Logger';

export interface SpanEvent {
    event: string;
    timestamp: number;
    data: unknown;
}

export interface Span {
    id: string;
    name: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    metadata: Record<string, unknown>;
    events: SpanEvent[];
    children: string[];
    result?: {
        success: boolean;
        error?: string;
        [key: string]: unknown;
    };
}

export interface TracerStats {
    [key: string]: {
        count: number;
        totalDuration: number;
        avgDuration: number;
        errors: number;
    };
}

export class Tracer {
    public activeSpans: Map<string, Span>;
    private completedSpans: Span[];
    private maxCompletedSpans: number;

    constructor() {
        this.activeSpans = new Map();
        this.completedSpans = [];
        this.maxCompletedSpans = 1000;
    }

    /**
     * Inicia un nuevo span de trazabilidad.
     */
    startSpan(name: string, metadata: Record<string, unknown> = {}): string {
        const spanId = uuidv4();
        const span: Span = {
            id: spanId,
            name,
            startTime: Date.now(),
            metadata,
            events: [],
            children: []
        };

        this.activeSpans.set(spanId, span);

        return spanId;
    }

    /**
     * Añade un evento al span.
     */
    addEvent(spanId: string, event: string, data: unknown = {}): void {
        const span = this.activeSpans.get(spanId);
        if (span) {
            span.events.push({
                event,
                timestamp: Date.now(),
                data
            });
        }
    }

    /**
     * Finaliza un span.
     */
    endSpan(spanId: string, result: Record<string, unknown> = {}): Span | null {
        const span = this.activeSpans.get(spanId);
        if (!span) {
            logger.warn(`[Tracer] Span not found: ${spanId}`);
            return null;
        }

        span.endTime = Date.now();
        span.duration = span.endTime - span.startTime;
        span.result = {
            success: result.success === true,
            error: typeof result.error === 'string' ? result.error : undefined,
            ...result
        };

        this.activeSpans.delete(spanId);
        this.completedSpans.push(span);

        // Mantener límite de spans guardados
        if (this.completedSpans.length > this.maxCompletedSpans) {
            this.completedSpans.shift();
        }

        return span;
    }

    /**
     * Crea un wrapper para funciones que las trace automáticamente.
     */
    trace<T extends (...args: unknown[]) => Promise<unknown>>(name: string, fn: T): T {
        const tracer = this;
        return (async function (this: unknown, ...args: Parameters<T>): Promise<ReturnType<T>> {
            const spanId = tracer.startSpan(name, { argsCount: args.length });
            try {
                const result = await fn.apply(this, args);
                tracer.endSpan(spanId, { success: true });
                return result as ReturnType<T>;
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                tracer.endSpan(spanId, { success: false, error: errorMessage });
                throw error;
            }
        }) as unknown as T;
    }

    /**
     * Obtiene spans recientes.
     */
    getRecentSpans(limit: number = 50): Span[] {
        return this.completedSpans.slice(-limit).reverse();
    }

    /**
     * Obtiene estadísticas de spans por nombre.
     */
    getStats(): TracerStats {
        const statsByName: TracerStats = {};

        for (const span of this.completedSpans) {
            const name = span.name; // Use local var for TS narrowing/consistency
            if (!statsByName[name]) {
                statsByName[name] = {
                    count: 0,
                    totalDuration: 0,
                    avgDuration: 0,
                    errors: 0
                };
            }

            statsByName[name].count++;
            statsByName[name].totalDuration += span.duration || 0;

            // Safe access to result
            if (span.result && span.result.success === false) {
                statsByName[name].errors++;
            }
        }

        // Calcular promedios
        for (const name in statsByName) {
            statsByName[name].avgDuration = Math.round(
                statsByName[name].totalDuration / statsByName[name].count
            );
        }

        return statsByName;
    }

    /**
     * Limpia todos los spans.
     */
    clear(): void {
        this.activeSpans.clear();
        this.completedSpans = [];
    }
}

// Exportar singleton
export const tracer = new Tracer();
