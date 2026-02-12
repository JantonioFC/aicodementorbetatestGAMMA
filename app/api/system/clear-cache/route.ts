import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST() {
    try {
        const cacheDir = path.join(process.cwd(), 'data', 'lesson-cache');
        if (fs.existsSync(cacheDir)) {
            const files = fs.readdirSync(cacheDir);
            files.forEach(f => f.endsWith('.json') && fs.unlinkSync(path.join(cacheDir, f)));
            return NextResponse.json({ success: true, deletedCount: files.length });
        }
        return NextResponse.json({ success: true, deletedCount: 0 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
