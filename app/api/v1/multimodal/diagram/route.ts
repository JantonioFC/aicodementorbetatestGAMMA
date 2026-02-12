import { NextRequest, NextResponse } from 'next/server';
import { diagramGenerator } from '@/lib/multimodal/DiagramGenerator';

export async function POST(req: NextRequest) {
    try {
        const { concept, type = 'flowchart' } = await req.json();

        if (!concept) {
            return NextResponse.json({ success: false, error: 'concept is required' }, { status: 400 });
        }

        const diagram = diagramGenerator.generateForConcept(concept, type);

        return NextResponse.json({
            success: true,
            diagram,
            concept,
            type
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
