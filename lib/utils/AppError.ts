/**
 * Error Operacional Estandarizado.
 * Distingue entre errores esperados (operacionales) y bugs (programación).
 */
export class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean;
    public status: string;

    constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational; // true = error confiable/esperado, false = crash/bug
        this.status = statusCode.toString().startsWith('4') ? 'fail' : 'error';

        Error.captureStackTrace(this, this.constructor);
    }
}
