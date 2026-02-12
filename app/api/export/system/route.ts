import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const action = searchParams.get('action');

        if (action === 'list-exports') {
            const baseDir = path.join(process.cwd(), 'exports');
            if (!fs.existsSync(baseDir)) return NextResponse.json({ exports: {} });

            const categories = ['lecciones', 'ejercicios', 'portfolio'];
            const result: Record<string, string[]> = {};
            categories.forEach(cat => {
                const p = path.join(baseDir, cat);
                result[cat] = fs.existsSync(p) ? fs.readdirSync(p) : [];
            });

            return NextResponse.json({ success: true, exports: result });
        }
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
