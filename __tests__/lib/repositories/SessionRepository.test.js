/**
 * Tests for SessionRepository
 */

// Mock the database
const mockDb = {
    get: jest.fn(),
    run: jest.fn(),
    query: jest.fn(() => [])
};

jest.mock('../../../lib/db', () => mockDb);

// Mock uuid - must be before requiring SessionRepository
jest.mock('uuid', () => ({
    v4: jest.fn(() => 'test-uuid-1234')
}));

const { SessionRepository } = require('../../../lib/repositories/SessionRepository');

describe('SessionRepository', () => {
    let repository;

    beforeEach(() => {
        repository = new SessionRepository();
        jest.clearAllMocks();
    });

    describe('getOrCreateActiveSession', () => {
        test('returns existing active session', () => {
            const existingSession = {
                id: 'existing-session-id',
                user_id: 'user-1',
                week_id: 1,
                status: 'ACTIVE'
            };
            mockDb.get.mockReturnValueOnce(existingSession);

            const result = repository.getOrCreateActiveSession('user-1', 1);

            expect(result.id).toBe('existing-session-id');
            expect(mockDb.run).not.toHaveBeenCalled();
        });

        test('creates new session when none exists', () => {
            // First call: no existing session
            // Second call: return the newly created session
            mockDb.get
                .mockReturnValueOnce(null)
                .mockReturnValueOnce({
                    id: 'test-uuid-1234',
                    user_id: 'user-1',
                    week_id: 1,
                    status: 'ACTIVE'
                });

            const result = repository.getOrCreateActiveSession('user-1', 1);

            expect(mockDb.run).toHaveBeenCalled();
            expect(result).toHaveProperty('id');
            expect(result.id).toBe('test-uuid-1234');
        });
    });

    describe('logInteraction', () => {
        test('inserts interaction record', () => {
            repository.logInteraction('session-1', 'LESSON_VIEWED', { lessonId: 'L1' });

            expect(mockDb.run).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO session_interactions'),
                expect.arrayContaining(['session-1', 'LESSON_VIEWED'])
            );
        });
    });

    describe('buildContextSummary', () => {
        test('returns first session message for no interactions', () => {
            mockDb.query.mockReturnValueOnce([]);

            const result = repository.buildContextSummary('session-1');

            // The implementation returns a default message for empty interactions
            expect(typeof result).toBe('string');
            expect(result).toContain('primera interacción');
        });

        test('builds summary from interactions', () => {
            mockDb.query.mockReturnValueOnce([
                {
                    interaction_type: 'LESSON_GENERATED',
                    content: JSON.stringify({ topic: 'Condicionales' }),
                    created_at: '2024-01-01 10:00:00'
                },
                {
                    interaction_type: 'QUIZ_ANSWERED',
                    content: JSON.stringify({ is_correct: true }),
                    created_at: '2024-01-01 10:30:00'
                }
            ]);

            const result = repository.buildContextSummary('session-1');

            expect(result).toContain('Historial');
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('endSession', () => {
        test('updates session status', () => {
            repository.endSession('session-1');

            expect(mockDb.run).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE learning_sessions'),
                expect.arrayContaining(['session-1'])
            );
        });
    });
});
