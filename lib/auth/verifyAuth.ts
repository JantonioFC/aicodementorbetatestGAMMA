/**
 * VERIFICACIÓN DE AUTENTICACIÓN
 * Módulo básico de verificación de autenticación JWT.
 */
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'local-development-secret-change-this';

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

        const decoded = jwt.verify(token, JWT_SECRET) as any;

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

    } catch (error: any) {
        console.error('[AUTH] Error verificando token:', error.message);
        return {
            isValid: false,
            error: 'Error interno de autenticación: ' + error.message
        };
    }
}

const verifyAuth = {
    verifyAuthToken
};

export default verifyAuth;
