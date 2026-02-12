import { cookies } from 'next/headers';
import { db } from '../db';
import verifyAuth from './verifyAuth';

const COOKIE_NAME = 'ai-code-mentor-auth';

export interface ServerAuthResult {
    user: { id: string; email: string; display_name: string } | null;
    userId: string | null;
    isAuthenticated: boolean;
}

interface UserRow {
    id: string;
    email: string;
    display_name: string;
}

export async function getServerAuth(): Promise<ServerAuthResult> {
    try {
        const cookieStore = await cookies();
        const tokenCookie = cookieStore.get(COOKIE_NAME);

        if (!tokenCookie?.value) {
            return { user: null, userId: null, isAuthenticated: false };
        }

        const verification = await verifyAuth.verifyAuthToken(tokenCookie.value);

        if (!verification.isValid || !verification.userId) {
            return { user: null, userId: null, isAuthenticated: false };
        }

        const userRecord = db.findOne<UserRow>('user_profiles', { id: verification.userId });

        if (!userRecord) {
            return { user: null, userId: null, isAuthenticated: false };
        }

        const user = {
            id: userRecord.id,
            email: userRecord.email,
            display_name: userRecord.display_name || ''
        };

        return {
            user,
            userId: userRecord.id,
            isAuthenticated: true
        };
    } catch (error: unknown) {
        return { user: null, userId: null, isAuthenticated: false };
    }
}
