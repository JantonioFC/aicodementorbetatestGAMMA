import { createApiHandler, sendSuccess, sendError } from '../../../lib/api/APIWrapper';
import { z } from 'zod';
import { withValidation } from '../../../lib/api/validate';

// Mock Response object
const mockRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('APIWrapper', () => {
    test('sendSuccess should format response', () => {
        const res = mockRes();
        sendSuccess(res, { foo: 'bar' });

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: { foo: 'bar' },
            error: null
        }));
    });

    test('sendError should format error', () => {
        const res = mockRes();
        sendError(res, 'Boom', 400);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            error: 'Boom'
        }));
    });

    test('createApiHandler should catch errors', async () => {
        const res = mockRes();
        const handler = jest.fn().mockRejectedValue(new Error('Async Fail'));
        const wrapped = createApiHandler(handler);

        await wrapped({} as any, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            error: 'Internal Server Error'
        }));
    });
});

describe('Validation Middleware', () => {
    const schema = z.object({
        name: z.string()
    });

    test('withValidation should pass valid data', async () => {
        const req = { body: { name: 'Juan' }, method: 'POST' };
        const res = mockRes();
        const handler = jest.fn();

        await withValidation(schema, handler)(req as any, res);

        expect(handler).toHaveBeenCalled();
    });

    test('withValidation should fail invalid data', async () => {
        const req = { body: { name: 123 }, method: 'POST' };
        const res = mockRes();
        const handler = jest.fn();

        await withValidation(schema, handler)(req as any, res);

        expect(handler).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            error: 'Validation Error'
        }));
    });
});
