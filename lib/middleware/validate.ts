import { NextApiRequest, NextApiResponse } from 'next';

/**
 * validate - Middleware para validar esquemas de entrada en API Routes.
 */

export interface ValidationSchema {
    method?: string;
    required?: string[];
    types?: Record<string, 'number' | 'array' | 'boolean' | 'string'>;
}

/**
 * Valida una solicitud contra un esquema.
 */
export function validate(schema: ValidationSchema, handler: (req: NextApiRequest, res: NextApiResponse) => Promise<any> | any) {
    return async (req: NextApiRequest, res: NextApiResponse) => {
        // Validar método HTTP
        if (schema.method && req.method !== schema.method) {
            return res.status(405).json({
                error: 'Method Not Allowed',
                message: `Expected ${schema.method}, got ${req.method}`
            });
        }

        const errors: string[] = [];
        const source = req.method === 'GET' ? req.query : req.body;

        // Validar campos requeridos
        if (schema.required) {
            for (const field of schema.required) {
                const val = source[field];
                if (val === undefined || val === null || val === '') {
                    errors.push(`Field '${field}' is required`);
                }
            }
        }

        // Validar tipos básicos
        if (schema.types) {
            for (const [field, type] of Object.entries(schema.types)) {
                const val = source[field];
                if (val !== undefined && val !== null) {
                    if (type === 'number' && isNaN(Number(val))) {
                        errors.push(`Field '${field}' must be a number`);
                    } else if (type === 'array' && !Array.isArray(val)) {
                        errors.push(`Field '${field}' must be an array`);
                    } else if (type === 'boolean') {
                        // En GET las booleanos vienen como strings 'true'/'false'
                        if (typeof val !== 'boolean') {
                            if (req.method === 'GET' && val !== 'true' && val !== 'false') {
                                errors.push(`Field '${field}' must be a boolean`);
                            } else if (req.method !== 'GET') {
                                errors.push(`Field '${field}' must be a boolean`);
                            }
                        }
                    }
                }
            }
        }

        // Si hay errores, responder 400
        if (errors.length > 0) {
            return res.status(400).json({
                status: 'fail',
                error: 'Validation Error',
                details: errors
            });
        }

        // Si pasa la validación, ejecutar el handler original
        return handler(req, res);
    };
}
