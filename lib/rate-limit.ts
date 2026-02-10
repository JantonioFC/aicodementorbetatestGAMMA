import { RateLimiterMemory } from 'rate-limiter-flexible';
import { NextApiRequest, NextApiResponse } from 'next';

const authLimiter = new RateLimiterMemory({ points: 5, duration: 15 * 60 });
const apiLimiter = new RateLimiterMemory({ points: 60, duration: 60 });
const aiLimiter = new RateLimiterMemory({ points: 10, duration: 5 * 60 });

export default async function rateLimit(req: NextApiRequest, res: NextApiResponse, profile: 'auth' | 'api' | 'ai' = 'auth') {
    let limiter, errorMessage;

    switch (profile) {
        case 'api':
            limiter = apiLimiter;
            errorMessage = 'Límite de peticiones de telemetría excedido.';
            break;
        case 'ai':
            limiter = aiLimiter;
            errorMessage = 'Límite de generación IA excedido. Por favor espera unos minutos.';
            break;
        default:
            limiter = authLimiter;
            errorMessage = 'Demasiados intentos de inicio de sesión.';
    }

    try {
        if (process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true') return;
        const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
        await limiter.consume(ip);
    } catch (rejRes) {
        res.status(429).json({ error: errorMessage });
        throw new Error('Rate limit exceeded');
    }
}
