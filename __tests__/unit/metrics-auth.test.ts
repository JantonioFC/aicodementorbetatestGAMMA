
import { NextRequest, NextResponse } from 'next/server';
import { GET } from '../../app/api/v1/metrics/route';
import { getServerAuth } from '../../lib/auth/serverAuth';

// Mocks
jest.mock('next/server', () => ({
    NextRequest: jest.fn().mockImplementation((url, init) => ({
        url,
        headers: new Map(Object.entries(init?.headers || {})),
        nextUrl: new URL(url)
    })),
    NextResponse: {
        json: jest.fn((body, init) => ({ body, status: init?.status || 200 }))
    }
}));

jest.mock('../../lib/auth/serverAuth', () => ({
    getServerAuth: jest.fn()
}));

jest.mock('../../lib/observability/Metrics', () => ({
    metricsCollector: {
        getMetrics: jest.fn().mockReturnValue({}),
        toPrometheus: jest.fn().mockReturnValue('')
    }
}));

jest.mock('../../lib/observability/Alerts', () => ({
    alertsSystem: {
        check: jest.fn().mockReturnValue([]),
        getSummary: jest.fn().mockReturnValue({})
    }
}));

jest.mock('../../lib/observability/Tracer', () => ({
    tracer: {
        getStats: jest.fn().mockReturnValue({}),
        activeSpans: { size: 0 }
    }
}));

describe('Metrics API Authentication', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
        process.env.METRICS_API_KEY = 'test-secret-key';
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('should return 401 when no credentials are provided', async () => {
        (getServerAuth as jest.Mock).mockResolvedValue({ isAuthenticated: false });

        const req = new NextRequest('http://localhost/api/v1/metrics', {
            headers: {}
        });

        const res = await GET(req);

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: 'Unauthorized - Invalid credentials' });
    });

    it('should return 200 when valid API Key is provided via x-api-key header', async () => {
        const req = new NextRequest('http://localhost/api/v1/metrics', {
            headers: { 'x-api-key': 'test-secret-key' }
        });

        const res = await GET(req);

        expect(res.status).toBe(200);
    });

    it('should return 200 when valid API Key is provided via Authorization header', async () => {
        const req = new NextRequest('http://localhost/api/v1/metrics', {
            headers: { 'authorization': 'Bearer test-secret-key' }
        });

        const res = await GET(req);

        expect(res.status).toBe(200);
    });

    it('should return 200 when user is authenticated admin', async () => {
        (getServerAuth as jest.Mock).mockResolvedValue({ isAuthenticated: true });

        const req = new NextRequest('http://localhost/api/v1/metrics', {
            headers: {}
        });

        const res = await GET(req);

        expect(res.status).toBe(200);
    });

    it('should return 401 when API Key is incorrect', async () => {
        (getServerAuth as jest.Mock).mockResolvedValue({ isAuthenticated: false });

        const req = new NextRequest('http://localhost/api/v1/metrics', {
            headers: { 'x-api-key': 'wrong-key' }
        });

        const res = await GET(req);

        expect(res.status).toBe(401);
    });
});
