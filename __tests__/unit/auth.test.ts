
import { verifyAuthToken } from '../../lib/auth/verifyAuth';
import * as auth from '../../lib/auth/auth';
import { db } from '../../lib/db';
import jwt from 'jsonwebtoken';
import { compare, hash } from 'bcryptjs';

// Mock dependencies
jest.mock('uuid', () => ({ v4: jest.fn(() => 'mock-uuid') }));
jest.mock('../../lib/db', () => ({
    db: {
        findOne: jest.fn(),
        insert: jest.fn()
    }
}));

jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

describe('Auth Unit Tests', () => {

    const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        full_name: 'Test User',
        password_hash: 'hashed_password',
        avatar_url: 'http://avatar.url'
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Setup default mocks
        (compare as jest.Mock).mockResolvedValue(true);
        (hash as jest.Mock).mockResolvedValue('hashed_password');
        (jwt.sign as jest.Mock).mockReturnValue('mock_token');
        (jwt.verify as jest.Mock).mockReturnValue({ userId: mockUser.id, email: mockUser.email });
    });

    describe('verifyAuthToken', () => {
        it('should return valid result for valid token', async () => {
            const token = 'valid_token';
            (jwt.verify as jest.Mock).mockReturnValue({ userId: '123', email: 'test@test.com', role: 'user' });

            const result = await verifyAuthToken(token);

            expect(result.isValid).toBe(true);
            expect(result.userId).toBe('123');
            expect(result.email).toBe('test@test.com');
            expect(result.role).toBe('user');
        });

        it('should return invalid for missing token', async () => {
            const result = await verifyAuthToken('');
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Token inválido o faltante');
        });

        it('should return invalid for expired token', async () => {
            (jwt.verify as jest.Mock).mockImplementation(() => {
                throw new jwt.TokenExpiredError('jwt expired', new Date());
            });

            const result = await verifyAuthToken('expired_token');
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Token inválido o expirado');
        });

        it('should return invalid for malformed token', async () => {
            (jwt.verify as jest.Mock).mockImplementation(() => {
                throw new jwt.JsonWebTokenError('jwt malformed');
            });

            const result = await verifyAuthToken('bad_token');
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Token inválido o expirado');
        });
    });

    describe('signInWithEmail', () => {
        it('should return user and session for valid credentials', async () => {
            (db.findOne as jest.Mock).mockReturnValue(mockUser);
            (compare as jest.Mock).mockResolvedValue(true);

            const result = await auth.signInWithEmail('test@example.com', 'password');

            expect(result.user.email).toBe(mockUser.email);
            expect(result.session.access_token).toBe('mock_token');
            expect(jwt.sign).toHaveBeenCalled();
        });

        it('should throw error for invalid email', async () => {
            (db.findOne as jest.Mock).mockReturnValue(null);

            await expect(auth.signInWithEmail('wrong@example.com', 'password'))
                .rejects.toThrow('Invalid credentials');
        });

        it('should throw error for invalid password', async () => {
            (db.findOne as jest.Mock).mockReturnValue(mockUser);
            (compare as jest.Mock).mockResolvedValue(false);

            await expect(auth.signInWithEmail('test@example.com', 'wrong_password'))
                .rejects.toThrow('Invalid credentials');
        });
    });

    describe('signUpWithEmail', () => {

        it('should create user and return session for new user', async () => {
            // First call for existing user check (returns null)
            // Second call for sign in (returns user)
            (db.findOne as jest.Mock)
                .mockReturnValueOnce(null)
                .mockReturnValueOnce(mockUser);

            (db.insert as jest.Mock).mockImplementation(() => { });

            const result = await auth.signUpWithEmail('new@example.com', 'password', { full_name: 'New User' });

            expect(db.findOne).toHaveBeenCalledWith('users', { email: 'new@example.com' });
            expect(hash).toHaveBeenCalledWith('password', 10);
            expect(db.insert).toHaveBeenCalledWith('users', expect.objectContaining({
                email: 'new@example.com',
                full_name: 'New User'
            }));

            // Should return session from signIn
            expect(result.session.access_token).toBe('mock_token');
        });

        it('should throw error if user already exists', async () => {
            (db.findOne as jest.Mock).mockReturnValue(mockUser);

            await expect(auth.signUpWithEmail('test@example.com', 'password'))
                .rejects.toThrow('User already exists');
        });
    });
});
