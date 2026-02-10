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
        if (result.error) return NextResponse.json(result, { status: 401 });

        const response = NextResponse.json({ user: result.user, session: result });
        response.cookies.set('ai-code-mentor-auth', result.token, { httpOnly: true, secure: true, path: '/' });
        response.cookies.set('ai-code-mentor-refresh', result.refreshToken, { httpOnly: true, secure: true, path: '/' });

        return response;
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
