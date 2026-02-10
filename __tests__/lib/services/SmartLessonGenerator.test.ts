import { smartLessonGenerator } from '../../../lib/services/SmartLessonGenerator';
import { queryExpander } from '../../../lib/rag/QueryExpander';
import { contentRetriever } from '../../../lib/rag/ContentRetriever';

// Mock dependencies
jest.mock('../../../lib/rag/QueryExpander', () => ({
    queryExpander: { expand: jest.fn().mockResolvedValue(['expanded query']) }
}));
jest.mock('../../../lib/rag/ContentRetriever', () => ({
    contentRetriever: { retrieve: jest.fn() }
}));
jest.mock('../../../lib/services/LessonService', () => ({
    lessonService: {
        generateLesson: jest.fn().mockResolvedValue({
            content: 'Mocked Lesson',
            metadata: { attempts: 1 }
        })
    }
}));
jest.mock('../../../lib/ai/ClarityGate');

describe('SmartLessonGenerator (Agentic Logic)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        // Setup default mocks
        (queryExpander.expand as jest.Mock).mockResolvedValue(['expanded query']);
        ((contentRetriever as any).retrieve as jest.Mock).mockResolvedValue([{ content: 'context data' }]);

        // @ts-ignore - accessing internal gate mock
        smartLessonGenerator.gate.checkRelevance.mockResolvedValue({ isRelevant: true, score: 0.9 });
    });

    test('should generate lesson successfully on first try', async () => {
        await smartLessonGenerator.generateWithAutonomy({ topic: 'React', difficulty: 'beginner' });

        expect((contentRetriever as any).retrieve).toHaveBeenCalled();
        // @ts-ignore
        expect(smartLessonGenerator.gate.checkRelevance).toHaveBeenCalled();
    });

    test('should retry when clarity check fails', async () => {
        // @ts-ignore - accessing internal gate mock
        smartLessonGenerator.gate.checkRelevance.mockRejectedValueOnce({ name: 'LowConfidenceError' }).mockResolvedValueOnce({ isRelevant: true });

        await smartLessonGenerator.generateWithAutonomy({ topic: 'Unknown', difficulty: 'beginner' });

        expect((contentRetriever as any).retrieve).toHaveBeenCalledTimes(2);
    });

    test('should proceed after max retries', async () => {
        // @ts-ignore
        smartLessonGenerator.gate.checkRelevance.mockRejectedValue({ name: 'LowConfidenceError' });

        await smartLessonGenerator.generateWithAutonomy({ topic: 'Impossible', difficulty: 'beginner' });

        // @ts-ignore
        expect(smartLessonGenerator.gate.checkRelevance).toHaveBeenCalledTimes(2);
    });
});
