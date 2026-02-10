import { NextRequest, NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/auth/serverAuth';

export async function GET() {
    const { user, isAuthenticated } = await getServerAuth();
    if (!isAuthenticated) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    return NextResponse.json({ user });
}
