/**
 * Sistema de Logging para AI Code Mentor
 * Registra interacciones con IA, errores y métricas de uso
 * 
 * @module lib/utils/logger
 */

// Módulos nativos (solo carga en servidor)
import type * as fsType from 'fs';
import type * as pathType from 'path';

let fs: typeof fsType | null = null;
let path: typeof pathType | null = null;

if (typeof window === 'undefined') {
    try {
        fs = require('fs');
        path = require('path');
    } catch (e) {
        // Fallback for edge runtime or weird envs
        console.warn('[Logger] Failed to require fs/path', e);
    }
}

// Define LogLevel constant
export const LogLevel = {
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
    DEBUG: 'debug'
} as const;

export type LogLevelType = typeof LogLevel[keyof typeof LogLevel];

interface LogContext {
    [key: string]: unknown;
}

interface LogEntry extends LogContext {
    timestamp: string;
    level: LogLevelType;
    message: string;
}

interface DailyReport {
    period: string;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    successRate: string;
    modelUsage: Record<string, number>;
    averageLatency: string;
    recentErrors: Array<{
        timestamp: string;
        model?: string;
        error?: string;
    }>;
}

class Logger {
    private rootPath: string = '/';
    private logDir: string = '';

    constructor() {
        if (typeof window === 'undefined') {
            try {
                // Safely access process.cwd() bypassing static analysis
                const globalProc = (globalThis as unknown as { process: { cwd: () => string } }).process;
                this.rootPath = (globalProc && typeof globalProc.cwd === 'function') ? globalProc.cwd() : '/';
                this.logDir = path && path.join ? path.join(this.rootPath, 'logs') : '/logs';
                this.ensureLogDir();
                this.cleanOldLogs().catch(e => console.error('[Logger] Auto cleanup failed:', e));
            } catch (e: unknown) {
                const message = e instanceof Error ? e.message : String(e);
                console.warn('[Logger] Could not initialize log directory (possibly non-Node environment):', message);
            }
        }
    }

    /**
     * Crear directorio de logs si no existe
     */
    private ensureLogDir(): void {
        if (typeof window === 'undefined' && this.logDir && fs && fs.existsSync) {
            try {
                if (!fs.existsSync(this.logDir)) {
                    fs.mkdirSync(this.logDir, { recursive: true });
                }
            } catch (e) {
                console.error('[Logger] Failed to create log directory:', e);
            }
        }
    }

    /**
     * Registrar mensaje informativo
     * @param {string} message - Mensaje
     * @param {LogContext} context - Datos adicionales
     */
    info(message: string, context: LogContext = {}): void {
        this.log(LogLevel.INFO, message, context);
    }

    /**
     * Registrar advertencia
     * @param {string} message - Mensaje
     * @param {LogContext} context - Datos adicionales
     */
    warn(message: string, context: LogContext = {}): void {
        this.log(LogLevel.WARN, message, context);
    }

    /**
     * Registrar depuración
     * @param {string} message - Mensaje
     * @param {LogContext} context - Datos adicionales
     */
    debug(message: string, context: LogContext = {}): void {
        this.log(LogLevel.DEBUG, message, context);
    }

    /**
     * Registrar error
     * @param {string} message - Mensaje
     * @param {unknown} error - Objeto de error o contexto
     */
    error(message: string, error: unknown = {}): void {
        const errorData = error instanceof Error
            ? { message: error.message, stack: error.stack, name: error.name }
            : (typeof error === 'object' && error !== null ? error : { error: String(error) });

        this.log(LogLevel.ERROR, message, errorData as LogContext);
    }

    /**
     * Método interno de logging genérico
     */
    private log(level: LogLevelType, message: string, data: LogContext = {}): void {
        const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...data
        };

        // En desarrollo, también loguear a consola con colores
        if (process.env.NODE_ENV !== 'production') {
            const prefix = `[${level.toUpperCase()}]`;
            if (level === 'error') console.error(prefix, message, data);
            else if (level === 'warn') console.warn(prefix, message, data);
            else console.log(prefix, message, data);
        }

        this.writeToFile(`${level}.log`, logEntry);
    }

    /**
     * Registrar una interacción exitosa con la IA
     * @param {LogContext} data - Datos de la interacción
     */
    logSuccess(data: LogContext): void {
        this.info('AI Interaction Success', {
            type: 'ai_success',
            ...data
        });
    }

    /**
     * Registrar un error (legacy wrapper)
     * @param {LogContext} data - Datos del error
     */
    logError(data: LogContext): void {
        this.error((data.error as string) || 'Unknown Error', {
            type: 'ai_error',
            ...data
        });
    }

    /**
     * Escribir a archivo de forma asíncrona
     * @param {string} filename - Nombre del archivo de log
     * @param {LogEntry} data - Datos a escribir
     */
    private writeToFile(filename: string, data: LogEntry): void {
        // Solo escribir a archivo en server-side
        if (typeof window !== 'undefined') {
            console.log(`[Logger] ${filename}:`, data);
            return;
        }

        const fsMod = fs;
        const pathMod = path;

        if (!this.logDir || !fsMod || !fsMod.appendFile || !pathMod || !pathMod.join) return;

        const filepath = pathMod.join(this.logDir, filename);
        const line = JSON.stringify(data) + '\n';

        fsMod.appendFile(filepath, line, (err: Error | null) => {
            if (err) {
                console.error('Error escribiendo log:', err);
            }
        });
    }

    /**
     * Obtener últimos N logs de un archivo
     * @param {string} filename - Nombre del archivo
     * @param {number} count - Cantidad de logs a obtener
     * @returns {Promise<Array<LogEntry>>} - Logs recientes
     */
    async getRecentLogs(filename: string, count: number = 50): Promise<LogEntry[]> {
        if (typeof window !== 'undefined') {
            return [];
        }

        const fsMod = fs;
        const pathMod = path;

        if (!this.logDir || !fsMod || !fsMod.existsSync || !fsMod.readFileSync || !pathMod || !pathMod.join) return [];

        const filepath = pathMod.join(this.logDir, filename);

        if (!fsMod.existsSync(filepath)) {
            return [];
        }

        try {
            const content = fsMod.readFileSync(filepath, 'utf-8');
            const lines = content.trim().split('\n').filter(Boolean);
            const recentLines = lines.slice(-count);

            return recentLines.map((line: string) => {
                try {
                    return JSON.parse(line) as LogEntry;
                } catch {
                    return {
                        timestamp: new Date().toISOString(),
                        level: LogLevel.INFO,
                        message: line,
                        raw: true
                    } as LogEntry;
                }
            });
        } catch (e) {
            console.error(`[Logger] Failed to read logs from ${filename}:`, e);
            return [];
        }
    }

    /**
     * Generar reporte de uso del último día
     * @returns {Promise<DailyReport>} - Reporte con métricas
     */
    async getDailyReport(): Promise<DailyReport> {
        const successLogs = await this.getRecentLogs('info.log', 1000);
        const errorLogs = await this.getRecentLogs('error.log', 1000);

        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

        const recentSuccess = successLogs.filter(
            (log) => new Date(log.timestamp).getTime() > oneDayAgo
        );

        const recentErrors = errorLogs.filter(
            (log) => new Date(log.timestamp).getTime() > oneDayAgo
        );

        const totalRequests = recentSuccess.length + recentErrors.length;
        const successRate =
            totalRequests > 0
                ? ((recentSuccess.length / totalRequests) * 100).toFixed(2)
                : '0';

        const modelUsage = recentSuccess.reduce((acc: Record<string, number>, log: LogEntry) => {
            const model = (log.model as string) || 'unknown';
            acc[model] = (acc[model] || 0) + 1;
            return acc;
        }, {});

        const avgLatency =
            recentSuccess.length > 0
                ? (
                    recentSuccess.reduce((sum: number, log: LogEntry) => sum + ((log.latency as number) || 0), 0) /
                    recentSuccess.length
                ).toFixed(0)
                : '0';

        return {
            period: '24 horas',
            totalRequests,
            successfulRequests: recentSuccess.length,
            failedRequests: recentErrors.length,
            successRate: `${successRate}%`,
            modelUsage,
            averageLatency: `${avgLatency}ms`,
            recentErrors: recentErrors.slice(-5).map((e: LogEntry) => ({
                timestamp: e.timestamp,
                model: e.model as string,
                error: (e.error as string) || (e.message as string)
            }))
        };
    }

    /**
     * Limpiar logs antiguos
     * @param {number} daysToKeep - Días a mantener
     */
    async cleanOldLogs(daysToKeep: number = 30): Promise<void> {
        if (typeof window !== 'undefined' || !this.logDir || !fs || !fs.readdirSync || !fs.statSync) {
            return;
        }

        try {
            const files = fs.readdirSync(this.logDir);
            const now = Date.now();
            const msToKeep = daysToKeep * 24 * 60 * 60 * 1000;

            for (const file of files) {
                const filepath = path!.join(this.logDir, file);
                const stats = fs.statSync(filepath);
                const age = now - stats.mtime.getTime();

                if (age > msToKeep) {
                    fs.unlinkSync(filepath);
                }
            }
        } catch (e) {
            console.error('[Logger] Failed to clean old logs:', e);
        }
    }
}

// Exportar instancia singleton
export const logger = new Logger();
