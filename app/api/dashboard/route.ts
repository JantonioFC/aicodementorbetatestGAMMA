import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    try {
        const totalEntries = (db.get('SELECT COUNT(*) as count FROM portfolio_entries') as { count: number }).count;
        const totalModules = (db.get('SELECT COUNT(*) as count FROM modules') as { count: number }).count;
        const recentEntries = db.query('SELECT * FROM portfolio_entries ORDER BY created_at DESC LIMIT 5');

        return NextResponse.json({
            success: true,
            entryCounts: {
                total: totalEntries,
                modules: totalModules
            },
            recentEntries: recentEntries || [],
            timestamp: new Date().toISOString()
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
