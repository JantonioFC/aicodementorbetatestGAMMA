const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, '..', 'database', 'sqlite', 'curriculum.db');

async function seedTestUser() {
    console.log('🌱 Seeding Test User (demo@aicodementor.com)...');

    if (!require('fs').existsSync(DB_PATH)) {
        console.error('❌ Database not found at ' + DB_PATH);
        process.exit(1);
    }

    const db = new Database(DB_PATH);

    try {
        // 1. Check if user exists in 'users'
        const email = 'demo@aicodementor.com';
        const password = 'demo123';

        let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        let userId;

        if (!user) {
            console.log('UNKNOWN USER: Creating new demo user...');
            userId = uuidv4();
            const hashedPassword = await bcrypt.hash(password, 10);

            db.prepare(`
        INSERT INTO users (id, email, password_hash, full_name, token_version, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(userId, email, hashedPassword, 'Demo User', 1, new Date().toISOString());
            console.log('✅ User created in users table.');
        } else {
            console.log('✅ User exists in users table.');
            userId = user.id;
        }

        // 2. Check if user profile exists
        const profile = db.prepare('SELECT * FROM user_profiles WHERE id = ?').get(userId);

        if (!profile) {
            console.log('MISSING PROFILE: Creating user profile...');
            db.prepare(`
        INSERT INTO user_profiles (id, email, display_name, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, email, 'Demo User', new Date().toISOString(), new Date().toISOString());
            console.log('✅ User profile created in user_profiles table.');
        } else {
            console.log('✅ User profile already exists.');
        }

    } catch (error) {
        console.error('❌ Error seeding test user:', error);
        process.exit(1);
    } finally {
        db.close();
    }
}

seedTestUser();
