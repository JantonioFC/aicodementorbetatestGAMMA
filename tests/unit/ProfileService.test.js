
import { ProfileService } from '../../lib/services/ProfileService';

// Mock dependencies - db exports both named { db } and default
jest.mock('../../lib/db', () => {
    const mockMethods = {
        findOne: jest.fn(),
        insert: jest.fn(),
        update: jest.fn(),
        get: jest.fn()
    };
    return {
        __esModule: true,
        db: mockMethods,
        default: mockMethods
    };
});

jest.mock('../../lib/observability/Logger', () => ({
    __esModule: true,
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
    }
}));

// Get reference to mocked db
const { db } = require('../../lib/db');

describe('ProfileService', () => {
    let profileService;

    beforeEach(() => {
        profileService = new ProfileService();
        jest.clearAllMocks();
    });

    describe('getProfile', () => {
        it('should return existing profile with stats', async () => {
            const mockUser = { id: 'user-1', email: 'test@example.com', created_at: '2023-01-01' };
            db.findOne.mockReturnValue(mockUser);
            // Mock getProgressStats internally called queries
            db.get
                .mockReturnValueOnce({ total: 10, correct: 8 }) // quiz
                .mockReturnValueOnce({ count: 5 }) // lessons
                .mockReturnValueOnce({ count: 3 }); // exercises

            const result = await profileService.getProfile('user-1', 'test@example.com');

            expect(db.findOne).toHaveBeenCalledWith('user_profiles', { id: 'user-1' });
            expect(result.email).toBe('test@example.com');
            expect(result.stats.quiz.total).toBe(10);
        });

        it('should create new profile if not exists', async () => {
            db.findOne.mockReturnValue(null);
            // Mock queries for stats (empty)
            db.get.mockReturnValue({ total: 0, count: 0 });

            await profileService.getProfile('user-2', 'new@example.com');

            expect(db.insert).toHaveBeenCalled();
        });
    });

    describe('updateProfile', () => {
        it('should update allowed fields', async () => {
            const updates = { display_name: 'New Name', bio: 'My Bio', invalid_field: 'hack' };
            db.findOne.mockReturnValue({ id: 'user-1', display_name: 'New Name' });

            await profileService.updateProfile('user-1', updates);

            expect(db.update).toHaveBeenCalledWith(
                'user_profiles',
                expect.objectContaining({
                    display_name: 'New Name',
                    bio: 'My Bio',
                    updated_at: expect.any(String)
                }),
                { id: 'user-1' }
            );
            // invalid_field should not be passed
            expect(db.update.mock.calls[0][1]).not.toHaveProperty('invalid_field');
        });
    });
});
