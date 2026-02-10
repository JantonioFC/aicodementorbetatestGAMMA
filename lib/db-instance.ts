import Database from 'better-sqlite3';
import * as path from 'path';

const DB_PATH = path.join(process.cwd(), 'database', 'sqlite', 'curriculum.db');

let dbInstance: Database.Database | null = null;

function getDb(): Database.Database {
    if (!dbInstance) {
        try {
            dbInstance = new Database(DB_PATH, {
                verbose: process.env.DB_VERBOSE === 'true' ? console.log : null
            });
            dbInstance.pragma('journal_mode = WAL');
            dbInstance.pragma('foreign_keys = ON');
        } catch (err) {
            console.error('[SQLite] Connection failed:', err);
            throw err;
        }
    }
    return dbInstance;
}

const db = getDb();
export default db;
export { db };
