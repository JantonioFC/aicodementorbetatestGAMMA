/**
 * SCRIPT: CREATE DEMO USER FOR E2E TESTS (LOCAL SQLITE)
 * 
 * Purpose: Register demo@aicodementor.com
 * STRATEGY: DESTROY AND RECREATE (Clean Slate).
 * 
 * IMPORTANT: loginUser() in auth-local.ts queries `user_profiles` for password_hash,
 * so we MUST store the hash there (not just in a separate `users` table).
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '..', 'database', 'sqlite', 'curriculum.db');
const DEMO_EMAIL = 'demo@aicodementor.com';
const DEMO_PASSWORD = 'demo123';
const DEMO_NAME = 'Usuario Demo';

async function createDemoUser() {
  console.log('🚀 Creating Demo User (Clean Slate)...');

  if (!fs.existsSync(DB_PATH)) {
    console.error('❌ Database not found at ' + DB_PATH);
    console.error('   Run "node scripts/init-sqlite.js" first.');
    process.exit(1);
  }

  const db = new Database(DB_PATH);

  try {
    // 1. DELETE EXISTING (Cleanup Mismatches)
    console.log('🧹 Cleaning up old data...');
    db.prepare('DELETE FROM user_profiles WHERE email = ?').run(DEMO_EMAIL);
    try {
      db.prepare('DELETE FROM users WHERE email = ?').run(DEMO_EMAIL);
    } catch (e) {
      // users table may not exist in all schemas - that's OK
    }
    console.log('✅ Old data removed.');

    // 2. Create user (Fresh)
    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
    // Use consistent UUID for E2E testing
    const userId = '00000000-0000-0000-0000-000000000001';

    console.log('🆕 Creating new user...');
    // User Profile WITH password_hash (REQUIRED by auth-local.ts loginUser)
    db.prepare(`
      INSERT INTO user_profiles (id, email, password_hash, token_version, display_name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, DEMO_EMAIL, hashedPassword, 1, DEMO_NAME, new Date().toISOString(), new Date().toISOString());

    console.log(`✅ Demo user created in user_profiles! ID: ${userId}`);

  } catch (err) {
    console.error('❌ Error creating demo user:', err);
    process.exit(1);
  } finally {
    db.close();
  }
}

createDemoUser();
