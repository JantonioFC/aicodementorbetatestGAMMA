import { NextRequest, NextResponse } from 'next/server';
import { lessonController } from '@/lib/controllers/LessonController';

export async function POST(req: NextRequest) {
    try {
        // Note: The controller might need adjustment for App Router Req/Res
        // But for now, we follow the established pattern
        const res = {
            status: (code: number) => ({
                json: (data: any) => NextResponse.json(data, { status: code })
            })
        } as any;

        return lessonController.generate(req as any, res as any);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
