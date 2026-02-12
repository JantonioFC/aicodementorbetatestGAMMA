import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
        throw new Error('FATAL: JWT_SECRET must be defined in production.');
    }
}

const SECRET_KEY: string = JWT_SECRET || '';
const IRP_SECRET = process.env.IRP_JWT_SECRET || SECRET_KEY;
const TOKEN_EXPIRATION = '15m';

export async function POST(req: NextRequest) {
    try {
        const { access_token } = await req.json();

        if (!access_token) {
            return NextResponse.json({ success: false, error: 'Missing access_token' }, { status: 400 });
        }

        let decoded: string | jwt.JwtPayload;
        try {
            decoded = jwt.verify(access_token, SECRET_KEY);
        } catch (e) {
            return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
        }

        if (!decoded || typeof decoded === 'string') {
            return NextResponse.json({ success: false, error: 'Invalid token structure' }, { status: 401 });
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
            { expiresIn: TOKEN_EXPIRATION, issuer: 'ai-code-mentor-core', audience: 'microservicio-irp' }
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

    } catch (error: unknown) {
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
