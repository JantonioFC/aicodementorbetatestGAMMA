import { NextRequest, NextResponse } from 'next/server';
import { curriculumService } from '@/lib/services/CurriculumService';

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const moduleId = searchParams.get('moduleId');
        if (!moduleId) return NextResponse.json({ error: 'Missing moduleId' }, { status: 400 });

        curriculumService.deleteModule(moduleId);
        return NextResponse.json({ success: true, message: 'Modulo eliminado' });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
