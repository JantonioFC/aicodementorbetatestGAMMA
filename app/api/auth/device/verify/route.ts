import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';
import AuthLocal from '@/lib/auth-local';

export const dynamic = 'force-dynamic';

interface VerifyRequestBody {
    user_code: string;
}

interface VerifyResponse {
    success: boolean;
    message: string;
}

interface ErrorResponse {
    error: string;
    message: string;
}

interface DeviceCodeRow {
    device_code: string;
    code: string;
    expires_at: string;
    status: 'pending' | 'authorized' | 'denied';
    user_id?: string;
}

/**
 * POST /api/auth/device/verify
 * 
 * Endpoint protegido. El usuario autenticado envía el `user_code` 
 * que ve en su VS Code para autorizarlo.
 */
export async function POST(request: NextRequest): Promise<NextResponse<VerifyResponse | ErrorResponse>> {
    try {
        // 1. Verificar Autenticación (Cookie)
        const cookieStore = await cookies();
        const tokenCookie = cookieStore.get('ai-code-mentor-auth');

        if (!tokenCookie) {
            return NextResponse.json({ error: 'unauthorized', message: 'Debes iniciar sesión primero' }, { status: 401 });
        }

        // @ts-ignore - AuthLocal is likely JS
        const authResult = AuthLocal.verifyToken(tokenCookie.value);

        if (!authResult.isValid) {
            return NextResponse.json({ error: 'unauthorized', message: 'Sesión expirada o inválida' }, { status: 401 });
        }

        const userId = authResult.userId;

        // 2. Obtener el código enviado por el usuario
        const body = await request.json() as VerifyRequestBody;
        const { user_code } = body;

        if (!user_code) {
            return NextResponse.json({ error: 'invalid_request', message: 'Código de usuario requerido' }, { status: 400 });
        }

        // 3. Buscar el código en DB
        // Normalizamos a mayúsculas por si acaso
        const cleanCode = user_code.trim().toUpperCase();

        // @ts-ignore
        const row = db.get('SELECT * FROM device_codes WHERE code = ?', [cleanCode]) as DeviceCodeRow | undefined;

        if (!row) {
            return NextResponse.json({ error: 'not_found', message: 'Código no encontrado o inválido' }, { status: 404 });
        }

        // 4. Validaciones de estado
        if (new Date(row.expires_at) < new Date()) {
            return NextResponse.json({ error: 'expired', message: 'El código ha expirado. Genera uno nuevo en VS Code.' }, { status: 400 });
        }

        if (row.status === 'authorized') {
            return NextResponse.json({ error: 'already_authorized', message: 'Este código ya fue autorizado.' }, { status: 400 });
        }

        if (row.status !== 'pending') {
            return NextResponse.json({ error: 'invalid_status', message: 'El código no está pendiente de aprobación.' }, { status: 400 });
        }

        // 5. Autorizar
        // Actualizamos status y asignamos el user_id
        // @ts-ignore
        db.run(`
            UPDATE device_codes 
            SET status = 'authorized', user_id = ?
            WHERE code = ?
        `, [userId ?? null, cleanCode]);

        return NextResponse.json({ success: true, message: 'Dispositivo conectado correctamente' });

    } catch (error: unknown) {
        console.error('[Device Verify] Error:', error);
        return NextResponse.json(
            { error: 'internal_server_error', message: 'Error interno al verificar código' },
            { status: 500 }
        );
    }
}
