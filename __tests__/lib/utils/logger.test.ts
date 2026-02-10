
import fs from 'fs';
import path from 'path';
import { logger, LogLevel } from '../../../lib/utils/logger';

// Mock fs and path
jest.mock('fs');
jest.mock('path');

describe('Logger', () => {
    const mockLogDir = '/mock/logs';
    const mockRoot = '/mock/root';

    beforeEach(() => {
        jest.clearAllMocks();
        // Setup path mocks
        (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
        // Mock process.cwd if needed, but logger initializes in constructor.
        // Since logger is a singleton exported as 'logger', it's already instantiated when imported.
        // This makes testing constructor logic hard.
        // However, we can test the methods of the instance.

        // We can't easily re-instantiate the singleton unless we export the class or use jest.isolateModules.
        // For now, let's test the side effects of methods on the existing singleton.
        // The logger instance would have been created when the module was loaded.
    });

    // Determine environment to adjust expectations
    const isNode = typeof window === 'undefined';

    it('should log info messages', () => {
        const spy = jest.spyOn(logger as any, 'writeToFile').mockImplementation(() => { });
        logger.info('Test info message', { key: 'value' });

        expect(spy).toHaveBeenCalledWith('info.log', expect.objectContaining({
            level: 'info',
            message: 'Test info message',
            key: 'value'
        }));
    });

    it('should log error messages', () => {
        const spy = jest.spyOn(logger as any, 'writeToFile').mockImplementation(() => { });
        logger.error('Test error message', { errorKey: 'errorValue' });

        expect(spy).toHaveBeenCalledWith('error.log', expect.objectContaining({
            level: 'error',
            message: 'Test error message',
            errorKey: 'errorValue'
        }));
    });

    it('should log warn messages', () => {
        const spy = jest.spyOn(logger as any, 'writeToFile').mockImplementation(() => { });
        logger.warn('Test warn message');

        expect(spy).toHaveBeenCalledWith('warn.log', expect.objectContaining({
            level: 'warn',
            message: 'Test warn message'
        }));
    });

    // Test writeToFile implicitly if we can.
    // Since writeToFile is private, we can't call it directly easily in TS without casting to any.
    // But we spy on it above.
    // Let's test the actual fs.appendFile call by mocking writeToFile behavior or checking fs calls if we don't spy it.

    it('should write to file in Node environment', () => {
        if (!isNode) return; // Skip in browser env

        // We need to restore the spy if we set it in previous tests, but beforeEach clears mocks.
        // However, jest.spyOn replaces the method. We should restore it.
        jest.restoreAllMocks();

        // Re-mock fs
        (fs.appendFile as unknown as jest.Mock).mockImplementation((path, data, cb) => cb(null));
        (path.join as jest.Mock).mockReturnValue('/mock/logs/info.log');

        // We need to inject logDir into existing logger if it wasn't set (e.g. if instantiated in browser-like env during test setup?)
        // The singleton is verified.
        // Let's assume it works.
        // Actually, we can't easily check internal state `logDir`.
        // Let's just call info and check fs.appendFile.

        // Force logDir for test
        (logger as any).logDir = '/mock/logs';

        logger.info('File write test');

        expect(fs.appendFile).toHaveBeenCalledWith(
            '/mock/logs/info.log',
            expect.stringContaining('"message":"File write test"'),
            expect.any(Function)
        );
    });

    describe('getDailyReport', () => {
        it('should generate a report from logs', async () => {
            // Mock getRecentLogs which is public
            jest.spyOn(logger, 'getRecentLogs').mockImplementation(async (filename) => {
                if (filename === 'success.log') {
                    return [
                        { timestamp: new Date().toISOString(), model: 'gpt-4', latency: 100 },
                        { timestamp: new Date().toISOString(), model: 'gpt-3.5', latency: 50 },
                    ];
                }
                if (filename === 'errors.log') {
                    return [
                        { timestamp: new Date().toISOString(), model: 'gpt-4', errorMessage: 'Timeout' }
                    ];
                }
                return [];
            });

            const report = await logger.getDailyReport();

            expect(report).toEqual({
                period: '24 horas',
                totalRequests: 3,
                successfulRequests: 2,
                failedRequests: 1,
                successRate: '66.67%',
                modelUsage: { 'gpt-4': 1, 'gpt-3.5': 1 },
                averageLatency: '75ms',
                recentErrors: expect.arrayContaining([
                    expect.objectContaining({ error: 'Timeout' })
                ])
            });
        });
    });
});
