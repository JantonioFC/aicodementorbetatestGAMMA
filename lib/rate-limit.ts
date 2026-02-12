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
        if (process.env.CI === 'true') return;
        const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
        await limiter.consume(ip);
    } catch (rejRes) {
        res.status(429).json({ error: errorMessage });
        throw new Error('Rate limit exceeded');
    }
}

/**
 * Higher-order function para envolver API Routes con rate limit.
 * Reemplaza a lib/middleware/rateLimit.ts
 */
export function withRateLimit(
    handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void | unknown> | void | unknown,
    profile: 'auth' | 'api' | 'ai' = 'auth'
) {
    return async (req: NextApiRequest, res: NextApiResponse): Promise<void | unknown> => {
        try {
            await rateLimit(req, res, profile);
            return await handler(req, res);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            // El error ya fue manejado en rateLimit enviando la respuesta 429
            if (message === 'Rate limit exceeded') {
                return;
            }
            throw error;
        }
    };
}
