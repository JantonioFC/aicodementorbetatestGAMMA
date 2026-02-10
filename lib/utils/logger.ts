/**
 * Sistema de Logging para AI Code Mentor
 * Registra interacciones con IA, errores y métricas de uso
 * 
 * @module lib/utils/logger
 */

// Módulos nativos (solo carga en servidor)
let fs: any = null;
let path: any = null;

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
    [key: string]: any;
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
                const globalProc = globalThis['process' as keyof typeof globalThis] as any;
                this.rootPath = (globalProc && typeof globalProc.cwd === 'function') ? globalProc.cwd() : '/';
                this.logDir = path.join(this.rootPath, 'logs');
                this.ensureLogDir();
            } catch (e: any) {
                console.warn('[Logger] Could not initialize log directory (possibly non-Node environment):', e.message);
            }
        }
    }

    /**
     * Crear directorio de logs si no existe
     */
    private ensureLogDir(): void {
        if (typeof window === 'undefined' && this.logDir && !fs.existsSync(this.logDir)) {
            try {
                fs.mkdirSync(this.logDir, { recursive: true });
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
     * Registrar error
     * @param {string} message - Mensaje
     * @param {any} error - Objeto de error o contexto
     */
    error(message: string, error: any = {}): void {
        const errorData = error instanceof Error
            ? { ...error, message: error.message, stack: error.stack }
            : error;

        this.log(LogLevel.ERROR, message, errorData);
    }

    /**
     * Método interno de logging genérico
     */
    private log(level: LogLevelType, message: string, data: LogContext = {}): void {
        const logEntry = {
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
        this.error(data.error || 'Unknown Error', {
            type: 'ai_error',
            ...data
        });
    }

    /**
     * Escribir a archivo de forma asíncrona
     * @param {string} filename - Nombre del archivo de log
     * @param {any} data - Datos a escribir
     */
    private writeToFile(filename: string, data: any): void {
        // Solo escribir a archivo en server-side
        if (typeof window !== 'undefined') {
            console.log(`[Logger] ${filename}:`, data);
            return;
        }

        if (!this.logDir) return;

        const filepath = path.join(this.logDir, filename);
        const line = JSON.stringify(data) + '\n';

        fs.appendFile(filepath, line, (err) => {
            if (err) {
                console.error('Error escribiendo log:', err);
            }
        });
    }

    /**
     * Obtener últimos N logs de un archivo
     * @param {string} filename - Nombre del archivo
     * @param {number} count - Cantidad de logs a obtener
     * @returns {Promise<Array<any>>} - Logs recientes
     */
    async getRecentLogs(filename: string, count: number = 50): Promise<any[]> {
        if (typeof window !== 'undefined') {
            return [];
        }

        if (!this.logDir) return [];

        const filepath = path.join(this.logDir, filename);

        if (!fs.existsSync(filepath)) {
            return [];
        }

        try {
            const content = fs.readFileSync(filepath, 'utf-8');
            const lines = content.trim().split('\n').filter(Boolean);
            const recentLines = lines.slice(-count);

            return recentLines.map(line => {
                try {
                    return JSON.parse(line);
                } catch {
                    return { raw: line };
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
        const successLogs = await this.getRecentLogs('success.log', 1000);
        const errorLogs = await this.getRecentLogs('errors.log', 1000);

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

        const modelUsage = recentSuccess.reduce((acc: Record<string, number>, log: any) => {
            const model = log.model || 'unknown';
            acc[model] = (acc[model] || 0) + 1;
            return acc;
        }, {});

        const avgLatency =
            recentSuccess.length > 0
                ? (
                    recentSuccess.reduce((sum: number, log: any) => sum + (log.latency || 0), 0) /
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
            recentErrors: recentErrors.slice(-5).map((e: any) => ({
                timestamp: e.timestamp,
                model: e.model,
                error: e.errorMessage
            }))
        };
    }

    /**
     * Limpiar logs antiguos
     * @param {number} daysToKeep - Días a mantener
     */
    async cleanOldLogs(daysToKeep: number = 30): Promise<void> {
        // Implementación futura para limpieza automática
        console.log(`[Logger] Limpieza de logs > ${daysToKeep} días pendiente`);
    }
}

// Exportar instancia singleton
export const logger = new Logger();
