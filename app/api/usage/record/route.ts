import { NextRequest, NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/auth/serverAuth';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const { userId, isAuthenticated } = await getServerAuth();
        if (!isAuthenticated) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

        const body = await req.json();
        db.insert('api_usage_logs', {
            user_id: userId,
            model: body.model,
            operation: body.operation || 'api-call',
            success: body.success ? 1 : 0,
            response_time_ms: body.responseTime || 0,
            timestamp: new Date().toISOString()
        });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
