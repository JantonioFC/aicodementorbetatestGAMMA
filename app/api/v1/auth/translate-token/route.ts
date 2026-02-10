import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'local-development-secret-change-this';
const IRP_SECRET = process.env.IRP_JWT_SECRET || JWT_SECRET;
const TOKEN_EXPIRATION = '15m';

export async function POST(req: NextRequest) {
    try {
        const { access_token } = await req.json();

        if (!access_token) {
            return NextResponse.json({ success: false, error: 'Missing access_token' }, { status: 400 });
        }

        let decoded: any;
        try {
            decoded = jwt.verify(access_token, JWT_SECRET);
        } catch (e) {
            return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
        }

        const userId = decoded.userId || decoded.sub;
        const userEmail = decoded.email;
        const userRole = decoded.role || 'student';

        const internalTokenPayload = {
            sub: userId,
            id: userId,
            email: userEmail,
            role: userRole,
            name: userEmail,
            iat: Math.floor(Date.now() / 1000)
        };

        const internalToken = jwt.sign(
            internalTokenPayload,
            IRP_SECRET,
            { expiresIn: TOKEN_EXPIRATION as any, issuer: 'ai-code-mentor-core', audience: 'microservicio-irp' }
        );

        return NextResponse.json({
            success: true,
            data: {
                access_token: internalToken,
                token_type: 'Bearer',
                expires_in: 15 * 60,
                user: { id: userId, email: userEmail, role: userRole }
            }
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
