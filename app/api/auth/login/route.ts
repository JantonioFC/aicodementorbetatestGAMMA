import { NextRequest, NextResponse } from 'next/server';
import AuthLocal from '@/lib/auth-local';
import { z } from 'zod';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const validation = loginSchema.safeParse(body);
        if (!validation.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

        const { email, password } = validation.data;
        const result = await AuthLocal.loginUser(email, password);
        if ('error' in result && result.error) return NextResponse.json(result, { status: 401 });

        // Now TypeScript knows result has token, refreshToken, and user
        const successResult = result as { token: string; refreshToken: string; user: Record<string, unknown> };

        const response = NextResponse.json({ user: successResult.user, session: successResult });
        response.cookies.set('ai-code-mentor-auth', successResult.token, { httpOnly: true, secure: true, path: '/' });
        response.cookies.set('ai-code-mentor-refresh', successResult.refreshToken, { httpOnly: true, secure: true, path: '/' });

        return response;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
