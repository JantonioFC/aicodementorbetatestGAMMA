import { NextRequest, NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/auth/serverAuth';
import exportService from '@/lib/services/exportService';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const { userId, isAuthenticated } = await getServerAuth();
        if (!isAuthenticated) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

        const { format, config } = await req.json();

        // Collect data
        const entries = db.query('SELECT * FROM portfolio_entries WHERE user_id = ?', [userId]);

        const document = {
            metadata: {
                title: 'Portfolio de Competencias',
                student: config.studentName || 'Estudiante',
                generatedAt: new Date().toLocaleDateString()
            },
            sections: [
                { title: 'Evidencias', content: JSON.stringify(entries) }
            ]
        };

        if (format === 'pdf') {
            const buffer = await exportService.generatePortfolioPDF(document);
            return new NextResponse(new Uint8Array(buffer), {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': 'attachment; filename=portfolio.pdf'
                }
            });
        }

        return NextResponse.json({ success: true, message: 'Export initiated' });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
