// lib/auth/auth.ts - Local Authentication System
import { db } from '../db';
import { compare, hash } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { serialize, parse } from 'cookie';
import { NextApiRequest, NextApiResponse } from 'next';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('FATAL: JWT_SECRET must be defined in production.');
    }
}

const SECRET_KEY: string = JWT_SECRET || '';
const COOKIE_NAME = 'ai-code-mentor-auth';

export interface AuthUser {
    id: string;
    email: string;
    role?: string; // RBAC support
    user_metadata: {
        full_name: string;
        avatar_url?: string;
    };
    app_metadata?: Record<string, unknown>;
}

interface UserRow {
    id: string;
    email: string;
    password_hash: string;
    full_name: string;
    avatar_url: string;
    created_at: string;
    role?: string; // RBAC support
}

interface JWTPayload {
    userId: string;
    email: string;
    name: string;
    role?: string; // RBAC support
}

/**
 * Helper to set auth cookie
 */
export function setAuthCookie(res: NextApiResponse, token: string): void {
    const cookie = serialize(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        sameSite: 'lax',
        path: '/',
    });
    res.setHeader('Set-Cookie', cookie);
}

/**
 * Helper to remove auth cookie
 */
export function removeAuthCookie(res: NextApiResponse): void {
    const cookie = serialize(COOKIE_NAME, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: -1,
        sameSite: 'lax',
        path: '/',
    });
    res.setHeader('Set-Cookie', cookie);
}

/**
 * Sign In with Email and Password
 */
export async function signInWithEmail(email: string, password: string): Promise<{ user: AuthUser; session: { access_token: string } }> {
    try {
        const user = db.findOne<UserRow>('users', { email });

        if (!user) {
            throw new Error('Invalid credentials');
        }

        const validPassword = await compare(password, user.password_hash);
        if (!validPassword) {
            throw new Error('Invalid credentials');
        }

        // Create session/token
        const token = jwt.sign(
            { userId: user.id, email: user.email, name: user.full_name } as JWTPayload,
            SECRET_KEY,
            { expiresIn: '7d' }
        );

        return {
            user: {
                id: user.id,
                email: user.email,
                user_metadata: { full_name: user.full_name, avatar_url: user.avatar_url }
            },
            session: { access_token: token }
        };
    } catch (error: unknown) {
        throw error;
    }
}

/**
 * Sign Up with Email and Password
 */
export async function signUpWithEmail(email: string, password: string, metadata: Record<string, unknown> = {}): Promise<{ user: AuthUser; session: { access_token: string } }> {
    try {
        const existingUser = db.findOne<UserRow>('users', { email });
        if (existingUser) {
            throw new Error('User already exists');
        }

        const hashedPassword = await hash(password, 10);
        const userId = uuidv4();

        db.insert('users', {
            id: userId,
            email,
            password_hash: hashedPassword,
            full_name: (metadata.full_name as string) || '',
            avatar_url: (metadata.avatar_url as string) || '',
            created_at: new Date().toISOString()
        });

        // Auto login
        return signInWithEmail(email, password);
    } catch (error: unknown) {
        throw error;
    }
}

/**
 * Sign Out
 */
export async function signOut(): Promise<{ error: null }> {
    return { error: null };
}

/**
 * Get Server User
 * Reads JWT from cookie and verifies it.
 */
export async function getServerUser(req: NextApiRequest, res?: NextApiResponse): Promise<AuthUser | null> {
    try {
        const cookies = parse(req.headers.cookie || '');
        const token = cookies[COOKIE_NAME];

        if (!token) return null;

        const decoded = jwt.verify(token, SECRET_KEY) as unknown as JWTPayload;

        const user = db.findOne<UserRow>('users', { id: decoded.userId });
        if (!user) return null;

        return {
            id: user.id,
            email: user.email,
            user_metadata: { full_name: user.full_name, avatar_url: user.avatar_url },
            app_metadata: {}
        };
    } catch (error: unknown) {
        return null;
    }
}
