import AuthLocal from '../../../lib/auth-local';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get token from cookie
    // CORRECCIÓN M-QUALITY: Usar el nombre de cookie correcto definido en login.js
    const token = req.cookies['ai-code-mentor-auth'] || req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = AuthLocal.verifyToken(token);

    if (!result.isValid) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    // For now, return basic info stored in token/db
    // We can query DB for full profile if we want
    const db = require('../../../lib/db');
    try {
        console.log('[API/AUTH/USER] Querying user profile for:', result.userId);
        const user = db.findOne('user_profiles', { id: result.userId });

        if (!user) {
            console.warn('[API/AUTH/USER] User not found in DB:', result.userId);
            return res.status(401).json({ error: 'User not found' });
        }

        console.log('[API/AUTH/USER] Found:', user.email);

        return res.status(200).json({
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                avatar_url: user.avatar_url,
                role: 'authenticated'
            }
        });
    } catch (err) {
        console.error('[API/AUTH/USER] DB Error:', err);
        return res.status(500).json({ error: 'Database error' });
    }
}
