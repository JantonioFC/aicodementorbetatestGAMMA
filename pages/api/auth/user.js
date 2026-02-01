import AuthLocal from '../../../lib/auth-local';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get token from cookie
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = AuthLocal.verifyToken(token);

    if (!result.isValid) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    // Fetch full user from DB if needed, or just return basic info from token
    // For now, return basic info stored in token/db
    // We can query DB for full profile if we want
    const db = require('../../../lib/db');
    const user = db.findOne('users', { id: result.userId });

    if (!user) {
        return res.status(401).json({ error: 'User not found' });
    }

    return res.status(200).json({
        user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            avatar_url: user.avatar_url,
            role: 'authenticated'
        }
    });
}
