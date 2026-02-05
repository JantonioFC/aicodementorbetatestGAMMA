import AuthLocal from '../../../lib/auth-local';
import { serialize } from 'cookie';
import rateLimit from '../../../lib/rate-limit'; // Security: Rate Limiting

import { z } from 'zod'; // Security: Input Validation

// Validation Schema
const loginSchema = z.object({
    email: z.string().email('Formato de email inválido'),
    password: z.string().min(1, 'La contraseña es requerida')
});

export default async function handler(req, res) {
    // 1. Rate Limiting Check
    try {
        await rateLimit(req, res, 'auth');
    } catch (e) {
        return; // Response already handled by rateLimit
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Input Validation (SEC-02)
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
        return res.status(400).json({
            error: 'Datos inválidos',
            details: validation.error.errors.map(e => e.message)
        });
    }

    const { email, password } = validation.data;

    try {
        const result = await AuthLocal.loginUser(email, password);

        if (result.error) {
            return res.status(401).json(result);
        }

        // Set JWT Cookie
        const cookie = serialize('ai-code-mentor-auth', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            sameSite: 'strict',
            path: '/'
        });

        res.setHeader('Set-Cookie', cookie);

        return res.status(200).json({
            user: result.user,
            session: {
                access_token: result.token,
                token_type: 'bearer',
                user: result.user
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
