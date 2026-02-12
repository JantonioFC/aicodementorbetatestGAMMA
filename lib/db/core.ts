import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { logger } from '../observability/Logger';

// Configuration
const DB_PATH = path.join(process.cwd(), 'database', 'sqlite', 'curriculum.db');

// Ensure DB exists or init it
if (!fs.existsSync(DB_PATH) && process.env.NODE_ENV !== 'test') {
    logger.warn('SQLite database not found', { path: DB_PATH });
}

let dbInstance: Database.Database | null = null;

function getDb(): Database.Database {
    if (!dbInstance) {
        try {
            dbInstance = new Database(DB_PATH, {
                verbose: process.env.DB_VERBOSE === 'true' ? console.log : undefined
            });
            // Performance: WAL mode
            dbInstance.pragma('journal_mode = WAL');
            // Data Integrity (DAT-01): Enforce Foreign Keys
            dbInstance.pragma('foreign_keys = ON');
        } catch (err) {
            logger.error('SQLite connection failed', err);
            throw err;
        }
    }
    return dbInstance;
}

export interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
}

export type QueryParams = string | number | boolean | null | Buffer | bigint;

export const db = {
    // Raw query execution (SELECT generic)
    query: <T = unknown>(sql: string, params: QueryParams[] = []): T[] => {
        return getDb().prepare(sql).all(params) as T[];
    },

    // Get single result (SELECT ONE generic)
    get: <T = unknown>(sql: string, params: QueryParams[] = []): T | undefined => {
        return getDb().prepare(sql).get(params) as T | undefined;
    },

    // Execute statement (INSERT, UPDATE, DELETE)
    run: (sql: string, params: QueryParams[] = []): RunResult => {
        return getDb().prepare(sql).run(params);
    },

    // Raw exec (for migrations/scripts)
    exec: (sql: string): void => {
        getDb().exec(sql);
    },

    // Transaction helper
    transaction: <T, A extends unknown[]>(fn: (...args: A) => T): ((...args: A) => T) => {
        return getDb().transaction(fn);
    },

    // Helper: Select with filters
    find: <T = unknown>(table: string, where: Record<string, QueryParams> = {}, select = '*'): T[] => {
        const keys = Object.keys(where);
        const whereClause = keys.length ? `WHERE ${keys.map(k => `${k} = ?`).join(' AND ')}` : '';
        const sql = `SELECT ${select} FROM ${table} ${whereClause}`;
        return getDb().prepare(sql).all(Object.values(where)) as T[];
    },

    findOne: <T = unknown>(table: string, where: Record<string, QueryParams> = {}, select = '*'): T | undefined => {
        const keys = Object.keys(where);
        const whereClause = keys.length ? `WHERE ${keys.map(k => `${k} = ?`).join(' AND ')}` : '';
        const sql = `SELECT ${select} FROM ${table} ${whereClause} LIMIT 1`;
        return getDb().prepare(sql).get(Object.values(where)) as T | undefined;
    },

    insert: (table: string, data: Record<string, QueryParams>): RunResult => {
        const keys = Object.keys(data);
        const cols = keys.join(', ');
        const placeholders = keys.map(() => '?').join(', ');
        const sql = `INSERT INTO ${table} (${cols}) VALUES (${placeholders})`;
        return getDb().prepare(sql).run(Object.values(data));
    },

    update: (table: string, data: Record<string, QueryParams>, where: Record<string, QueryParams>): RunResult => {
        const dataKeys = Object.keys(data);
        const setClause = dataKeys.map(k => `${k} = ?`).join(', ');
        const whereKeys = Object.keys(where);
        const whereClause = whereKeys.map(k => `${k} = ?`).join(' AND ');

        const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
        const params = [...Object.values(data), ...Object.values(where)] as QueryParams[];
        return getDb().prepare(sql).run(params);
    },

    // Explicit close (mostly for tests)
    close: (): void => {
        if (dbInstance) {
            dbInstance.close();
            dbInstance = null;
        }
    }
};

export const getRawDb = getDb;
export default db;
