// Mock modules BEFORE requiring the SUT (System Under Test)
jest.mock('../../../lib/services/LessonService', () => ({
    lessonService: {
        generateLesson: jest.fn()
    }
}));

jest.mock('../../../lib/ai/ClarityGate', () => ({
    clarityGate: {
        evaluate: jest.fn()
    }
}));

jest.mock('../../../lib/rag/ContentRetriever', () => ({
    contentRetriever: {
        buildPromptContext: jest.fn()
    }
}));

// Now require the SUT
const { smartLessonGenerator } = require('../../../lib/services/SmartLessonGenerator');
const { clarityGate } = require('../../../lib/ai/ClarityGate');
const { lessonService } = require('../../../lib/services/LessonService');

describe('SmartLessonGenerator', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should have retry logic configuration', () => {
        expect(smartLessonGenerator.maxRetries).toBe(2);
    });

    test('should success on first try if gate passes', async () => {
        // Setup Mocks
        clarityGate.evaluate.mockResolvedValue({ passed: true, score: 0.9 });
        lessonService.generateLesson.mockResolvedValue({ content: 'Lesson' });

        const context = { semanaId: 1, dia: 1, pomodoroIndex: 0 };
        const result = await smartLessonGenerator.generateWithRetry(context);

        expect(result.content).toBe('Lesson');
        expect(lessonService.generateLesson).toHaveBeenCalledTimes(1);
    });

    test('should retry if gate fails initially', async () => {
        // First call fails gate, Second call passes gate (simulated logic flow)
        // In real SUT, logic says: if gate fails -> expand options -> retry generation
        // But the SUT calls generateLesson anyway after fixing options or retrying.

        // Let's verify SmartLessonGenerator retry loop behavior.
        // It calls gate.evaluate -> if fail -> loop continue (retry)

        clarityGate.evaluate
            .mockResolvedValueOnce({ passed: false, score: 0.2, reasoning: 'bad' }) // Attempt 1
            .mockResolvedValueOnce({ passed: true, score: 0.9 }); // Attempt 2

        lessonService.generateLesson.mockResolvedValue({ content: 'Lesson Retry' });

        const context = { semanaId: 1, dia: 1, pomodoroIndex: 0 };
        const result = await smartLessonGenerator.generateWithRetry(context);

        // Should have called generateLesson eventually
        expect(lessonService.generateLesson).toHaveBeenCalled();
        // Should have evaluated twice
        expect(clarityGate.evaluate).toHaveBeenCalledTimes(2);
    });
});
