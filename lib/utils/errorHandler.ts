/**
 * Manejo de Errores para AI Code Mentor
 * Clases de error personalizadas y mensajes amigables al usuario
 */

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical' | 'unknown';

export interface AIErrorDetails {
    severity: ErrorSeverity;
    recoverable: boolean;
    provider?: string;
}

/**
 * Error de proveedor de IA (genérico)
 */
export class AIProviderError extends Error implements AIErrorDetails {
    public provider: string;
    public originalError: any;
    public severity: ErrorSeverity = 'high';
    public recoverable: boolean = true;

    constructor(provider: string, originalError: any) {
        super(`Error en proveedor ${provider}: ${originalError.message}`);
        this.name = 'AIProviderError';
        this.provider = provider;
        this.originalError = originalError;
    }
}

/**
 * Error de límite de tasa alcanzado
 */
export class RateLimitError extends Error implements AIErrorDetails {
    public provider: string;
    public retryAfter: number;
    public severity: ErrorSeverity = 'medium';
    public recoverable: boolean = true;

    constructor(provider: string, retryAfter: number = 60) {
        super(`Rate limit alcanzado en ${provider}. Reintenta en ${retryAfter}s`);
        this.name = 'RateLimitError';
        this.provider = provider;
        this.retryAfter = retryAfter;
    }
}

/**
 * Error de respuesta inválida de la IA
 */
export class InvalidResponseError extends Error implements AIErrorDetails {
    public provider: string;
    public response: any;
    public severity: ErrorSeverity = 'high';
    public recoverable: boolean = true;

    constructor(provider: string, response: any) {
        super(`Respuesta inválida de ${provider}`);
        this.name = 'InvalidResponseError';
        this.provider = provider;
        this.response = response;
    }
}

/**
 * Error cuando todos los modelos fallaron
 */
export class AllModelsFailedError extends Error implements AIErrorDetails {
    public attemptedModels: string[];
    public errors: any[];
    public severity: ErrorSeverity = 'critical';
    public recoverable: boolean = false;

    constructor(attemptedModels: string[], errors: any[]) {
        super('Todos los modelos de IA fallaron');
        this.name = 'AllModelsFailedError';
        this.attemptedModels = attemptedModels;
        this.errors = errors;
    }
}

/**
 * Error de modelo no disponible
 */
export class ModelNotAvailableError extends Error implements AIErrorDetails {
    public modelName: string;
    public reason: string;
    public severity: ErrorSeverity = 'medium';
    public recoverable: boolean = true;

    constructor(modelName: string, reason: string) {
        super(`Modelo ${modelName} no disponible: ${reason}`);
        this.name = 'ModelNotAvailableError';
        this.modelName = modelName;
        this.reason = reason;
    }
}

/**
 * Manejador central de errores de IA
 */
export function handleAIError(
    error: any,
    context: {
        provider?: string,
        model?: string,
        response?: any,
        attemptedModels?: string[],
        errors?: any[]
    } = {}
): Error {
    const errorMessage = error.message?.toLowerCase() || '';

    // Rate limit
    if (errorMessage.includes('rate limit') ||
        errorMessage.includes('429') ||
        errorMessage.includes('quota')) {
        return new RateLimitError(context.provider || 'unknown', 60);
    }

    // Respuesta inválida
    if (errorMessage.includes('invalid') ||
        errorMessage.includes('parse') ||
        errorMessage.includes('json')) {
        return new InvalidResponseError(context.provider || 'unknown', context.response);
    }

    // Modelo no disponible
    if (errorMessage.includes('not found') ||
        errorMessage.includes('deprecated') ||
        errorMessage.includes('unavailable')) {
        return new ModelNotAvailableError(
            context.model || 'unknown',
            error.message
        );
    }

    // Todos los modelos fallaron
    if (context.attemptedModels && context.attemptedModels.length > 1) {
        return new AllModelsFailedError(
            context.attemptedModels,
            context.errors || [error]
        );
    }

    // Error genérico de proveedor
    return new AIProviderError(context.provider || 'unknown', error);
}

/**
 * Generar mensaje de error amigable para el usuario
 */
export function getUserFriendlyMessage(error: any): string {
    if (error instanceof RateLimitError) {
        return `Has alcanzado el límite de consultas temporalmente. Por favor espera ${error.retryAfter} segundos e intenta de nuevo.`;
    }

    if (error instanceof AllModelsFailedError) {
        return 'No pudimos procesar tu consulta en este momento. Por favor verifica tu conexión a internet e intenta nuevamente.';
    }

    if (error instanceof InvalidResponseError) {
        return 'La respuesta de la IA fue inesperada. Por favor intenta de nuevo.';
    }

    if (error instanceof ModelNotAvailableError) {
        return `El modelo de IA solicitado no está disponible actualmente. Intentando con alternativa...`;
    }

    if (error instanceof AIProviderError) {
        return 'Ocurrió un error al procesar tu consulta. Por favor intenta de nuevo en unos momentos.';
    }

    // Error genérico
    return 'Ocurrió un error inesperado. Por favor intenta de nuevo.';
}

/**
 * Verificar si un error es recuperable
 */
export function isRecoverable(error: any): boolean {
    return (error as AIErrorDetails).recoverable === true;
}

/**
 * Obtener severidad del error
 */
export function getSeverity(error: any): ErrorSeverity {
    return (error as AIErrorDetails).severity || 'unknown';
}
