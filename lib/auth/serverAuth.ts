import db from '../db';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000';
const DEMO_USER = {
    id: DEMO_USER_ID,
    email: 'demo@aicodementor.com',
    display_name: 'Estudiante Demo'
};

export async function getServerAuth() {
    let user = db.findOne('user_profiles', { id: DEMO_USER_ID });

    if (!user) {
        try {
            db.insert('user_profiles', {
                id: DEMO_USER_ID,
                email: DEMO_USER.email,
                display_name: DEMO_USER.display_name,
                created_at: new Date().toISOString()
            });
            user = DEMO_USER;
        } catch (e) {
            user = DEMO_USER;
        }
    }

    return {
        user,
        userId: DEMO_USER_ID,
        isAuthenticated: true
    };
}
