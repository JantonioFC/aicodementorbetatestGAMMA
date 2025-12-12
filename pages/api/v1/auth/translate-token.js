/**
 * Endpoint de Traducción de Tokens - Autenticación Federada
 * LOCAL AUTH VERSION
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'local-development-secret-change-this';
const IRP_SECRET = process.env.IRP_JWT_SECRET || JWT_SECRET; // Fallback to same secret if not set
const TOKEN_EXPIRATION = '15m';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed'
    });
  }

  try {
    const { access_token } = req.body;

    if (!access_token) {
      return res.status(400).json({
        success: false,
        error: 'Missing access_token'
      });
    }

    // Verify the incoming token (it should be our local JWT)
    let decoded;
    try {
      decoded = jwt.verify(access_token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    const userId = decoded.userId || decoded.sub;
    const userEmail = decoded.email;
    const userRole = decoded.role || 'student';

    // Generate internal token for IRP
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

    return res.status(200).json({
      success: true,
      data: {
        access_token: internalToken,
        token_type: 'Bearer',
        expires_in: 15 * 60,
        user: { id: userId, email: userEmail, role: userRole }
      }
    });

  } catch (error) {
    console.error('Translate token error:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
