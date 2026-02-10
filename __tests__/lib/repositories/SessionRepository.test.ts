import { SessionRepository } from '../../../lib/repositories/SessionRepository';

// Mock the database
const mockDb = {
    get: jest.fn(),
    run: jest.fn(),
    query: jest.fn(() => [])
};

jest.mock('../../../lib/db', () => ({
    db: mockDb
}));

// Mock uuid
jest.mock('uuid', () => ({
    v4: jest.fn(() => 'test-uuid-1234')
}));

describe('SessionRepository', () => {
    let repository: SessionRepository;

    beforeEach(() => {
        repository = new SessionRepository();
        jest.clearAllMocks();
    });

    describe('getOrCreateActiveSession', () => {
        test('returns existing active session', async () => {
            const existingSession = {
                id: 'existing-session-id',
                user_id: 'user-1',
                week_id: 1,
                status: 'ACTIVE'
            };
            mockDb.get.mockResolvedValueOnce(existingSession);

            const result = await repository.getOrCreateActiveSession('user-1', 1);

            expect(result.id).toBe('existing-session-id');
            expect(mockDb.run).not.toHaveBeenCalled();
        });

        test('creates new session when none exists', async () => {
            mockDb.get
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({
                    id: 'test-uuid-1234',
                    user_id: 'user-1',
                    week_id: 1,
                    status: 'ACTIVE'
                });

            const result = await repository.getOrCreateActiveSession('user-1', 1);

            expect(mockDb.run).toHaveBeenCalled();
            expect(result).toHaveProperty('id');
            expect(result.id).toBe('test-uuid-1234');
        });
    });

    describe('logInteraction', () => {
        test('inserts interaction record', async () => {
            await repository.logInteraction('session-1', 'LESSON_VIEWED', { lessonId: 'L1' });

            expect(mockDb.run).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO session_interactions'),
                expect.arrayContaining(['session-1', 'LESSON_VIEWED'])
            );
        });
    });

    describe('endSession', () => {
        test('updates session status', async () => {
            await repository.endSession('session-1');

            expect(mockDb.run).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE learning_sessions'),
                expect.arrayContaining(['session-1'])
            );
        });
    });
});
