import { NextResponse } from 'next/server';
import { multimodalService } from '@/lib/multimodal/MultimodalService';

export async function GET() {
    try {
        const capabilities = multimodalService.getCapabilities();
        return NextResponse.json({ success: true, capabilities });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
