import { NextResponse } from 'next/server';
import { multimodalService } from '@/lib/multimodal/MultimodalService';

export async function GET() {
    try {
        const capabilities = multimodalService.getCapabilities();
        return NextResponse.json({ success: true, capabilities });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
