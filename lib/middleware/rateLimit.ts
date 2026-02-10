import { NextApiRequest, NextApiResponse } from 'next';

/**
 * rateLimit - Middleware para limitar la tasa de solicitudes por IP.
 * En producción real, se recomienda usar Redis para persistencia y escalabilidad.
 */

const rateLimitCache = new Map<string, { count: number, expiry: number }>();

const WINDOW_SIZE_MS = 60 * 1000; // 1 minuto
const MAX_REQUESTS = 60; // 60 requests por minuto por IP

function cleanOldEntries() {
    const now = Date.now();
    for (const [key, value] of rateLimitCache.entries()) {
        if (now > value.expiry) {
            rateLimitCache.delete(key);
        }
    }
}

// Limpieza periódica (cada 10 min) en entornos de servidor
if (typeof setInterval !== 'undefined') {
    setInterval(cleanOldEntries, 10 * 60 * 1000);
}

/**
 * Ejecuta la verificación de rate limit.
 */
export function rateLimit(req: NextApiRequest, res: NextApiResponse): Promise<boolean> {
    // Si estamos en build time o server-side rendering interno, saltar
    if (!req || !res) return Promise.resolve(false);

    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    const key = `ratelimit:${ip}`;
    const now = Date.now();

    const record = rateLimitCache.get(key) || { count: 0, expiry: now + WINDOW_SIZE_MS };

    // Reset si expiró la ventana
    if (now > record.expiry) {
        record.count = 0;
        record.expiry = now + WINDOW_SIZE_MS;
    }

    record.count++;
    rateLimitCache.set(key, record);

    const currentUsage = record.count;
    const remaining = Math.max(0, MAX_REQUESTS - currentUsage);

    // Configurar headers de rate limit estándar
    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', record.expiry);

    if (currentUsage > MAX_REQUESTS) {
        return Promise.reject({
            status: 429,
            message: 'Too Many Requests'
        });
    }

    return Promise.resolve(true);
}

/**
 * Higher-order function para envolver API Routes con rate limit.
 */
export function withRateLimit(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<any> | any) {
    return async (req: NextApiRequest, res: NextApiResponse) => {
        try {
            await rateLimit(req, res);
            return handler(req, res);
        } catch (error: any) {
            if (error.status === 429) {
                return res.status(429).json({
                    success: false,
                    error: 'Demasiadas solicitudes. Por favor intente más tarde.'
                });
            }
            // Propagar otros errores para que el handler global los maneje
            throw error;
        }
    };
}
