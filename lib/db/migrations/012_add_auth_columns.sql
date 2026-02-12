-- Migration 012: Add authentication columns to user_profiles
-- Required by auth-local.ts loginUser() which queries user_profiles for password verification

ALTER TABLE user_profiles ADD COLUMN password_hash TEXT;
ALTER TABLE user_profiles ADD COLUMN token_version INTEGER DEFAULT 1;
