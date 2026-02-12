import { NextRequest, NextResponse } from 'next/server';
import type { NextApiRequest, NextApiResponse } from 'next';
import { lessonController } from '@/lib/controllers/LessonController';

export async function POST(req: NextRequest) {
    try {
        // Note: The controller might need adjustment for App Router Req/Res
        // But for now, we follow the established pattern
        const res = {
            status: (code: number) => ({
                json: (data: Record<string, unknown>) => NextResponse.json(data, { status: code })
            })
        } as unknown as NextApiResponse;

        return lessonController.generate(req as unknown as NextApiRequest, res);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
