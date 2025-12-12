import db from '../lib/db';

/**
 * LOCAL-FIRST AUTH MIDDLEWARE (M-Local)
 * 
 * In this local-first architecture, we simplify auth to a single "Demo User".
 * 
 * Logic:
 * 1. Check if 'demo-user' exists in SQLite.
 * 2. If not, create it.
 * 3. Inject this user into req.user and req.authContext.
 * 
 * This effectively makes the app "single user" and always authenticated.
 */

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000';
const DEMO_USER = {
  id: DEMO_USER_ID,
  email: 'demo@aicodementor.com',
  display_name: 'Estudiante Demo',
  role: 'authenticated',
  aud: 'authenticated'
};

export function withRequiredAuth(handler, allowedRoles = []) {
  return async (req, res) => {
    try {
      // 1. Ensure Demo User Exists in DB
      let user = db.findOne('user_profiles', { id: DEMO_USER_ID });

      if (!user) {
        console.log('👤 [AUTH] Creating local demo user...');
        try {
          db.insert('user_profiles', {
            id: DEMO_USER_ID,
            email: DEMO_USER.email,
            display_name: DEMO_USER.display_name,
            created_at: new Date().toISOString()
          });
        } catch (e) {
          console.log('⚠️ [AUTH] User created concurrently or error:', e.message);
        }
        user = DEMO_USER;
      }

      // 2. Inject User Context
      req.user = user;
      req.authContext = {
        user: user,
        userId: user.id,
        email: user.email,
        isAuthenticated: true,
        token: 'mock-local-token'
      };

      // 3. Proceed to Handler
      return await handler(req, res);

    } catch (error) {
      console.error('🔐 [AUTH] Error in local auth middleware:', error);
      // Fallback for safety
      req.authContext = { isAuthenticated: false };
      return res.status(500).json({ error: 'Internal Auth Error' });
    }
  };
}

export function withOptionalAuth(handler) {
  return withRequiredAuth(handler); // For local version, optional is same as required (always logged in)
}

// Legacy helper compatibility
export function withAdminAuth(handler) {
  return withRequiredAuth(handler); // No admin role in local version yet
}

export function createAdaptiveResponse(req, authenticatedResponse, anonymousResponse) {
  // Always authenticated in local version
  return {
    success: true,
    authenticated: true,
    data: authenticatedResponse,
    timestamp: new Date().toISOString()
  };
}
