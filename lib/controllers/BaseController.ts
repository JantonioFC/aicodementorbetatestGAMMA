
// lib/controllers/BaseController.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { logger } from '../observability/Logger';

export abstract class BaseController {
    protected handleSuccess(res: NextApiResponse, data: Record<string, unknown> | unknown[], status: number = 200): void {
        res.status(status).json({
            success: true,
            data
        });
    }

    protected handleError(res: NextApiResponse, error: unknown, context: string): void {
        const message = error instanceof Error ? error.message : String(error);
        const errorName = error instanceof Error ? error.name : 'UnknownError';

        logger.error(`[${context}] Error: ${message}`, { error });

        // Map known errors
        if (errorName === 'ZodError') {
            const details = (error as { issues?: unknown }).issues;
            res.status(400).json({
                success: false,
                error: 'Validation Error',
                details
            });
            return;
        }

        if (errorName === 'LowConfidenceError') {
            res.status(422).json({
                success: false,
                error: 'AI Context Verification Failed',
                message
            });
            return;
        }

        const statusCode = (error as { status?: number }).status || 500;
        const msg = message || 'Internal Server Error';

        res.status(statusCode).json({
            success: false,
            error: msg
        });
    }
}
