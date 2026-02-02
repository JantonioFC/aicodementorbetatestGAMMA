const { ClarityGate, LowConfidenceError } = require('../../../lib/ai/ClarityGate'); // Import Class
const geminiRouter = require('../../../lib/ai/router/GeminiRouter');

// Mock Gemini Router to prevent API calls
jest.mock('../../../lib/ai/router/GeminiRouter', () => ({
    analyze: jest.fn()
}));

const { logger } = require('../../../lib/utils/logger');
// Mock Logger
jest.mock('../../../lib/utils/logger', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }
}));


describe('ClarityGate', () => {
    let gate;

    beforeEach(() => {
        gate = new ClarityGate(0.7);
        jest.clearAllMocks();
    });

    test('should pass valid context (High Score)', async () => {
        // Mock LLM Response
        geminiRouter.analyze.mockResolvedValue({
            relevance_score: 0.9,
            reasoning: 'Perfect match'
        });

        const result = await gate.checkRelevance('recursion', 'recursion is a function calling itself...');
        expect(result).toBe(true);
    });

    test('should throw LowConfidenceError on irrelevant context', async () => {
        // Mock LLM Response
        geminiRouter.analyze.mockResolvedValue({
            relevance_score: 0.2, // Below 0.7
            reasoning: 'Completely unrelated'
        });

        await expect(gate.checkRelevance('recursion', 'The weather is nice'))
            .rejects
            .toThrow(LowConfidenceError);
    });

    test('should pass if context is empty (Fail Open/Warn)', async () => {
        // According to logic, empty context returns true but logs warning
        const result = await gate.checkRelevance('query', '');
        expect(result).toBe(true);
        expect(logger.warn).toHaveBeenCalled();
    });
});

