import { NextRequest, NextResponse } from 'next/server';
import { autoSaveService } from '@/lib/services/AutoSaveService';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const action = searchParams.get('action');

        if (action === 'get-statistics') {
            const stats = autoSaveService.getStatistics();
            return NextResponse.json({ success: true, statistics: stats });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const action = searchParams.get('action');
        const body = await req.json();

        if (action === 'save-session') {
            const id = autoSaveService.saveSession(body);
            return NextResponse.json({ success: true, session_id: id });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
