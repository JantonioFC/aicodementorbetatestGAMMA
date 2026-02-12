import { NextRequest, NextResponse } from 'next/server';
import { textToSpeechService } from '@/lib/multimodal/TextToSpeechService';

export async function POST(req: NextRequest) {
    try {
        const { text, provider = 'fal', voice } = await req.json();

        if (!text) {
            return NextResponse.json({ success: false, error: 'text is required' }, { status: 400 });
        }

        if (text.length > 5000) {
            const chunks = textToSpeechService.splitIntoChunks(text);
            const browserScript = textToSpeechService.generateBrowserScript(text);

            return NextResponse.json({
                success: true,
                provider: 'browser',
                chunks: chunks.length,
                browserScript,
                note: 'Text too long for API, use browser fallback'
            });
        }

        const result = await textToSpeechService.synthesize(text, { provider, voice });

        return NextResponse.json({
            ...result
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
