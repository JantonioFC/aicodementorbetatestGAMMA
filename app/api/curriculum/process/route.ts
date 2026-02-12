import { NextRequest, NextResponse } from 'next/server';
import { curriculumService } from '@/lib/services/CurriculumService';

export async function POST(req: NextRequest) {
    try {
        const { filename, content } = await req.json();
        if (!filename || !content) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

        const result = await curriculumService.processModule(filename, content);
        return NextResponse.json({ success: true, ...result });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
