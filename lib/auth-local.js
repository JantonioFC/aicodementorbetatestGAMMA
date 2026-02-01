/**
 * SERVICIO DE AUTENTICACIÓN LOCAL (SQLite)
 * Reemplazo de Supabase Auth para modo offline/local.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-prod';
const JWT_EXPIRES_IN = '7d';

const AuthLocal = {
    /**
     * Registra un nuevo usuario
     */
    async registerUser(email, password, fullName = '') {
        try {
            // Verificar si existe
            const existing = db.findOne('users', { email });
            if (existing) {
                return { error: 'El usuario ya existe' };
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const userId = uuidv4();

            // Transacción: Crear usuario + perfil base
            db.transaction(() => {
                // 1. Crear usuario auth
                db.insert('users', {
                    id: userId,
                    email,
                    password_hash: hashedPassword,
                    full_name: fullName,
                    created_at: new Date().toISOString()
                });

                // 2. Crear perfil asociado (importante para FKs)
                db.insert('user_profiles', {
                    id: userId,
                    email,
                    display_name: fullName || email.split('@')[0],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            })();

            // Auto-login
            const token = this.generateToken(userId, email);
            return { user: { id: userId, email, full_name: fullName }, token };

        } catch (error) {
            console.error('[AuthLocal] Register error:', error);
            return { error: 'Error registrando usuario' };
        }
    },

    /**
     * Inicia sesión
     */
    async loginUser(email, password) {
        try {
            const user = db.findOne('users', { email });
            if (!user) {
                return { error: 'Credenciales inválidas' };
            }

            const isValid = await bcrypt.compare(password, user.password_hash);
            if (!isValid) {
                return { error: 'Credenciales inválidas' };
            }

            const token = this.generateToken(user.id, user.email);
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    full_name: user.full_name,
                    avatar_url: user.avatar_url
                },
                token
            };

        } catch (error) {
            console.error('[AuthLocal] Login error:', error);
            return { error: 'Error de inicio de sesión' };
        }
    },

    /**
     * Genera JWT
     */
    generateToken(userId, email) {
        return jwt.sign(
            { sub: userId, email, aud: 'authenticated', role: 'authenticated' },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
    },

    /**
     * Verifica JWT y retorna usuario
     */
    verifyToken(token) {
        try {
            if (!token) return { error: 'Token no proporcionado' };

            // Remover 'Bearer ' si existe
            const cleanToken = token.replace('Bearer ', '');

            const decoded = jwt.verify(cleanToken, JWT_SECRET);
            return {
                isValid: true,
                userId: decoded.sub,
                email: decoded.email,
                role: decoded.role
            };
        } catch (error) {
            return { isValid: false, error: 'Token inválido o expirado' };
        }
    }
};

export default AuthLocal;
