/**
 * SERVICIO DE AUTENTICACIÓN LOCAL (SQLite)
 * Reemplazo de Supabase Auth para modo offline/local.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import db from './db';

const JWT_SECRET = process.env.JWT_SECRET;
const NODE_ENV = process.env.NODE_ENV;
const CI = process.env.CI;

if (!JWT_SECRET) {
    if (NODE_ENV === 'production' && CI !== 'true') {
        throw new Error('FATAL: JWT_SECRET must be defined in production.');
    }
    console.warn('⚠️ [AuthLocal] JWT_SECRET missing. Using insecure fallback (safe for CI/Build).');
}

// SEC-01: Hardening - Fail fast if secret is missing in prod (unless CI), otherwise use env var
const SECRET_KEY: string = JWT_SECRET ||
    (NODE_ENV === 'development' ||
        NODE_ENV === 'test' ||
        CI === 'true' ? 'dev-secret-key-safe-for-local-only' : '');

if (!SECRET_KEY && NODE_ENV === 'production' && CI !== 'true') {
    throw new Error('FATAL: JWT_SECRET must be defined.');
}

const JWT_EXPIRES_IN = '15m'; // Short-lived access token

export interface AuthUser {
    id: string;
    email: string;
    display_name?: string;
    full_name?: string;
}

export interface AuthTokens {
    token: string;
    refreshToken: string;
}

const AuthLocal = {
    /**
     * Registra un nuevo usuario
     */
    async registerUser(email: string, password: string, fullName: string = '') {
        try {
            const existing = db.findOne('user_profiles', { email });
            if (existing) {
                return { error: 'El usuario ya existe' };
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const userId = uuidv4();
            const initialVersion = 1;

            db.transaction(() => {
                db.insert('user_profiles', {
                    id: userId,
                    email,
                    display_name: fullName || email.split('@')[0],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });

                // Si hubiera tabla users con pwd, se insertaría aquí
                // db.insert('users', { id: userId, password: hashedPassword });
            })();

            const tokens = await this.generateTokenPair(userId, email, initialVersion);
            return { user: { id: userId, email, full_name: fullName }, ...tokens };

        } catch (error) {
            console.error('[AuthLocal] Register error:', error);
            return { error: 'Error registrando usuario' };
        }
    },

    /**
     * Inicia sesión
     */
    async loginUser(email: string, _password?: string) {
        try {
            const user = db.findOne('user_profiles', { email });
            if (!user) return { error: 'Usuario no encontrado' };

            const version = 1;
            const tokens = await this.generateTokenPair(user.id, user.email, version);

            return {
                user: {
                    id: user.id,
                    email: user.email,
                    display_name: user.display_name
                },
                ...tokens
            };
        } catch (error) {
            console.error('[AuthLocal] Login error:', error);
            return { error: 'Error de inicio de sesión' };
        }
    },

    /**
     * Genera un par de tokens (Access + Refresh)
     */
    async generateTokenPair(userId: string, email: string, version: number): Promise<AuthTokens> {
        const accessToken = this.generateToken(userId, email, version);
        const refreshToken = uuidv4();

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        db.insert('refresh_tokens', {
            id: uuidv4(),
            user_id: userId,
            token: refreshToken,
            expires_at: expiresAt.toISOString()
        });

        return { token: accessToken, refreshToken };
    },

    /**
     * Genera JWT (Access Token)
     */
    generateToken(userId: string, email: string, version: number): string {
        return jwt.sign(
            {
                sub: userId,
                email,
                aud: 'authenticated',
                role: 'authenticated',
                v: version
            },
            SECRET_KEY,
            { expiresIn: JWT_EXPIRES_IN }
        );
    },

    /**
     * Verifica JWT
     */
    verifyToken(token: string) {
        try {
            if (!token) return { error: 'Token no proporcionado' };
            const cleanToken = token.replace('Bearer ', '');
            const decoded = jwt.verify(cleanToken, SECRET_KEY) as any;

            return {
                isValid: true,
                userId: decoded.sub,
                email: decoded.email,
                role: decoded.role
            };
        } catch (error) {
            return { isValid: false, error: 'Token inválido o expirado' };
        }
    },

    /**
     * Refresca un Access Token usando un Refresh Token
     */
    async refreshAccessToken(refreshToken: string) {
        try {
            const stored = db.findOne('refresh_tokens', { token: refreshToken, revoked: 0 });

            if (!stored) {
                return { error: 'Refresh token inválido o revocado' };
            }

            if (new Date(stored.expires_at) < new Date()) {
                return { error: 'Refresh token expirado' };
            }

            const user = db.findOne('user_profiles', { id: stored.user_id });
            if (!user) {
                return { error: 'Usuario no encontrado' };
            }

            const accessToken = this.generateToken(user.id, user.email, 1);
            return { token: accessToken };
        } catch (error) {
            console.error('[AuthLocal] Refresh error:', error);
            return { error: 'Error al refrescar token' };
        }
    },

    /**
     * Revoca un refresh token (logout)
     */
    async revokeRefreshToken(refreshToken: string) {
        try {
            db.update('refresh_tokens', { revoked: 1 }, { token: refreshToken });
            return true;
        } catch (error) {
            console.error('[AuthLocal] Revoke error:', error);
            return false;
        }
    },

    /**
     * Verifica un Personal Access Token (PAT)
     */
    verifyPAT(rawToken: string) {
        try {
            if (!rawToken || !rawToken.startsWith('pat_')) return { error: 'Formato de token inválido' };

            const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
            const pat = db.findOne('personal_access_tokens', { token_hash: tokenHash });

            if (!pat) {
                return { isValid: false, error: 'Token no encontrado o revocado' };
            }

            const user = db.findOne('user_profiles', { id: pat.user_id });
            if (!user) {
                return { isValid: false, error: 'Usuario asociado no encontrado' };
            }

            db.update('personal_access_tokens', { last_used_at: new Date().toISOString() }, { id: pat.id });

            return {
                isValid: true,
                user,
                patLabel: pat.label
            };

        } catch (error) {
            console.error('[AuthLocal] PAT Verification Error:', error);
            return { isValid: false, error: 'Error interno verificando token' };
        }
    }
};

export default AuthLocal;
export { AuthLocal };
