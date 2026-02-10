/**
 * Tests for EmbeddingService
 */

import { EmbeddingService } from '../../../lib/rag/EmbeddingService';

// Mock the database and Google AI
jest.mock('../../../lib/db', () => ({
    db: {
        exec: jest.fn(),
        get: jest.fn(),
        run: jest.fn(),
        query: jest.fn(() => [])
    }
}));

jest.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
            embedContent: jest.fn().mockResolvedValue({
                embedding: { values: new Array(768).fill(0.1) }
            })
        })
    }))
}));

describe('EmbeddingService', () => {
    let service: any;

    beforeEach(() => {
        service = new EmbeddingService();
    });

    describe('_cosineSimilarity', () => {
        test('returns 1 for identical vectors', () => {
            const vec = [1, 2, 3, 4, 5];
            const similarity = service._cosineSimilarity(vec, vec);
            expect(similarity).toBeCloseTo(1, 5);
        });

        test('returns 0 for orthogonal vectors', () => {
            const vec1 = [1, 0, 0];
            const vec2 = [0, 1, 0];
            const similarity = service._cosineSimilarity(vec1, vec2);
            expect(similarity).toBeCloseTo(0, 5);
        });

        test('returns -1 for opposite vectors', () => {
            const vec1 = [1, 0, 0];
            const vec2 = [-1, 0, 0];
            const similarity = service._cosineSimilarity(vec1, vec2);
            expect(similarity).toBeCloseTo(-1, 5);
        });

        test('handles normalized vectors correctly', () => {
            const vec1 = [0.6, 0.8]; // normalized
            const vec2 = [0.8, 0.6]; // normalized
            const similarity = service._cosineSimilarity(vec1, vec2);
            expect(similarity).toBeGreaterThan(0);
            expect(similarity).toBeLessThan(1);
        });
    });

    describe('_sleep', () => {
        test('delays execution', async () => {
            const start = Date.now();
            // @ts-ignore - accessing internal method for test
            await service._sleep(100);
            const elapsed = Date.now() - start;
            expect(elapsed).toBeGreaterThanOrEqual(90);
        });
    });
});
