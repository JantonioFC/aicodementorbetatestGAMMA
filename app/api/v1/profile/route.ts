import { NextRequest, NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/auth/serverAuth';
import { profileService } from '@/lib/services/ProfileService';
import { z } from 'zod';

const updateProfileSchema = z.object({
    display_name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    preferences: z.record(z.string(), z.unknown()).optional(),
    avatar_url: z.string().url().optional()
});

export async function GET() {
    try {
        const { userId, user, isAuthenticated } = await getServerAuth();

        if (isAuthenticated) {
            if (!userId || !user) {
                return NextResponse.json({ error: 'Auth error' }, { status: 401 });
            }
            const profile = await profileService.getProfile(userId, user.email);
            return NextResponse.json({
                success: true,
                profile,
                capabilities: ['Ver progreso', 'Actualizar info'],
                isGuest: false
            });
        } else {
            return NextResponse.json({
                success: true,
                profile: { display_name: 'Guest User' },
                isGuest: true,
                limitations: ['Solo info básica']
            });
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId, isAuthenticated } = await getServerAuth();
        if (!isAuthenticated) return NextResponse.json({ error: 'Auth required' }, { status: 401 });
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const parsed = updateProfileSchema.parse(body);
        const updated = await profileService.updateProfile(userId, parsed);

        return NextResponse.json({
            success: true,
            message: 'Perfil actualizado',
            profile: updated
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        const { userId, isAuthenticated } = await getServerAuth();
        if (!isAuthenticated) return NextResponse.json({ error: 'Auth required' }, { status: 401 });
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await profileService.deleteUser(userId);
        return NextResponse.json({ success: true, message: 'Cuenta eliminada' });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
