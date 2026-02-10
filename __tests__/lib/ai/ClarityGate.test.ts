import { ClarityGate, LowConfidenceError } from '../../../lib/ai/ClarityGate';
import { geminiRouter } from '../../../lib/ai/router/GeminiRouter';
import { logger } from '../../../lib/utils/logger';

// Mock Gemini Router to prevent API calls
jest.mock('../../../lib/ai/router/GeminiRouter', () => ({
    geminiRouter: {
        analyze: jest.fn()
    }
}));

// Mock Logger
jest.mock('../../../lib/utils/logger', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }
}));

// Mock PromptLoader
jest.mock('../../../lib/prompts/PromptLoader', () => ({
    promptLoader: {
        load: jest.fn(() => ({ relevance_check: 'Check relevance...' })),
        interpolate: jest.fn(() => 'Interpolated Prompt')
    }
}));

describe('ClarityGate', () => {
    let gate: ClarityGate;

    beforeEach(() => {
        gate = new ClarityGate(0.7);
        jest.clearAllMocks();
    });

    test('should pass valid context (High Score)', async () => {
        (geminiRouter.analyze as jest.Mock).mockResolvedValue({
            analysis: {
                relevance_score: 0.9,
                reasoning: 'Perfect match'
            },
            metadata: { model: 'mock' }
        });

        const result = await gate.checkRelevance('recursion', 'recursion is a function calling itself...');
        expect(result).toBe(true);
    });

    test('should throw LowConfidenceError on irrelevant context', async () => {
        (geminiRouter.analyze as jest.Mock).mockResolvedValue({
            analysis: {
                relevance_score: 0.2,
                reasoning: 'Completely unrelated'
            },
            metadata: { model: 'mock' }
        });

        await expect(gate.checkRelevance('recursion', 'The weather is nice'))
            .rejects
            .toThrow(LowConfidenceError);
    });

    test('should pass if context is empty (Fail Open/Warn)', async () => {
        const result = await gate.checkRelevance('query', '');
        expect(result).toBe(true);
        expect(logger.warn).toHaveBeenCalled();
    });
});
