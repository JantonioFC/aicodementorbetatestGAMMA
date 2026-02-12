import { NextRequest, NextResponse } from 'next/server';
import AuthLocal from '@/lib/auth-local';

const COOKIE_NAME = 'ai-code-mentor-refresh';
const AUTH_COOKIE_NAME = 'ai-code-mentor-auth';

export async function POST(req: NextRequest) {
    try {
        const refreshToken = req.cookies.get(COOKIE_NAME)?.value;

        if (!refreshToken) {
            return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
        }

        const result = await AuthLocal.refreshAccessToken(refreshToken);

        if ('error' in result && result.error) {
            return NextResponse.json({ error: result.error }, { status: 401 });
        }

        const successResult = result as { token: string };
        const isSecure = process.env.NODE_ENV === 'production' && !process.env.E2E_TEST_MODE;
        const response = NextResponse.json({ success: true });
        response.cookies.set(AUTH_COOKIE_NAME, successResult.token, { httpOnly: true, secure: isSecure, path: '/', sameSite: 'lax' });

        return response;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
