import { NextApiRequest, NextApiResponse } from 'next';
import { ZodError, ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
    return (req: NextApiRequest, res: NextApiResponse) => {
        try {
            if (req.method === 'GET') {
                req.query = schema.parse(req.query);
            } else {
                req.body = schema.parse(req.body);
            }
            return true;
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({ success: false, error: 'Validation Error', details: error.errors });
                return false;
            }
            throw error;
        }
    };
}

export function withValidation(schema: ZodSchema, handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
    return async (req: NextApiRequest, res: NextApiResponse) => {
        try {
            const data = req.method === 'GET' ? req.query : req.body;
            const parsed = schema.parse(data);

            if (req.method === 'GET') req.query = parsed;
            else req.body = parsed;

            return handler(req, res);
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({ success: false, error: 'Validation Error', details: error.errors });
            }
            throw error;
        }
    };
}
