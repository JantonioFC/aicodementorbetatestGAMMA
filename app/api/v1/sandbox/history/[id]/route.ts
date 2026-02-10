import { NextRequest, NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/auth/serverAuth';
import db from '@/lib/db';

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await getServerAuth();
        const { id } = await params;

        const result = db.run('DELETE FROM sandbox_generations WHERE id = ? AND user_id = ?', [id, userId]) as any;

        if (result.changes === 0) {
            return NextResponse.json({ success: false, error: 'Not Found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Eliminado' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
