/**
 * VERIFICACIÓN DE AUTENTICACIÓN
 * Módulo básico de verificación de autenticación JWT.
 */
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('FATAL: JWT_SECRET must be defined in production.');
    }
}

const SECRET_KEY: string = JWT_SECRET || '';

interface JWTPayload {
    userId: string;
    email: string;
    role?: string;
}

export interface AuthVerificationResult {
    isValid: boolean;
    userId?: string;
    email?: string;
    role?: string;
    error?: string;
}

/**
 * Verifica la validez de un token JWT de autenticación.
 */
export async function verifyAuthToken(token: string): Promise<AuthVerificationResult> {
    try {
        if (!token || typeof token !== 'string') {
            return {
                isValid: false,
                error: 'Token inválido o faltante'
            };
        }

        const decoded = jwt.verify(token, SECRET_KEY) as unknown as JWTPayload;

        if (decoded && decoded.userId) {
            return {
                isValid: true,
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role
            };
        }

        return {
            isValid: false,
            error: 'Token no autorizado'
        };

    } catch (error: unknown) {
        const isTokenError = error instanceof jwt.JsonWebTokenError ||
            error instanceof jwt.TokenExpiredError ||
            error instanceof jwt.NotBeforeError;
        return {
            isValid: false,
            error: isTokenError ? 'Token inválido o expirado' : 'Error interno de autenticación'
        };
    }
}

const verifyAuth = {
    verifyAuthToken
};

export default verifyAuth;
