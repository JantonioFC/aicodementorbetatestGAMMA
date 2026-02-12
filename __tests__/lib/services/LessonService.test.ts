
import { lessonService, LessonRequest } from '../../../lib/services/LessonService';
import { geminiRouter } from '../../../lib/ai/router/GeminiRouter';
import { logger } from '../../../lib/observability/Logger';

// Mock dependencies
jest.mock('../../../lib/ai/router/GeminiRouter');
jest.mock('../../../lib/observability/Logger');
jest.mock('../../../lib/prompts/LessonPrompts', () => ({
    buildLessonPromptMessages: jest.fn().mockReturnValue([{ role: 'user', content: 'mock prompt' }])
}));

describe('LessonService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockRequest: LessonRequest = {
        topic: 'TypeScript Interfaces',
        difficulty: 'Intermediate',
        language: 'typescript'
    };

    test('should generate lesson successfully', async () => {
        // Setup Gemini Router Mock
        (geminiRouter.analyze as jest.Mock).mockResolvedValue({
            success: true,
            analysis: {
                feedback: '# TypeScript Interfaces\nCheck this out.',
                strengths: [],
                improvements: [],
                examples: [],
                score: null
            },
            metadata: {
                model: 'gemini-pro',
                tokensUsed: 100,
                latency: 500
            }
        });

        const lesson = await lessonService.generateLesson(mockRequest);

        expect(lesson).toBeDefined();
        expect(lesson.title).toContain('TypeScript Interfaces');
        expect(lesson.content).toContain('# TypeScript Interfaces');
        expect(lesson.metadata.model).toBe('gemini-pro');

        expect(geminiRouter.analyze).toHaveBeenCalledWith(expect.objectContaining({
            language: 'typescript',
            phase: 'fase-1'
        }));
    });

    test('should throw error if topic is missing', async () => {
        const invalidRequest = { ...mockRequest, topic: '' };

        await expect(lessonService.generateLesson(invalidRequest))
            .rejects
            .toThrow('Topic is required');
    });

    test('should handle AI errors gracefully', async () => {
        (geminiRouter.analyze as jest.Mock).mockRejectedValue(new Error('AI Overload'));

        await expect(lessonService.generateLesson(mockRequest))
            .rejects
            .toThrow('AI Overload');

        expect(logger.error).toHaveBeenCalled();
    });
});
