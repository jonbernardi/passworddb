import {onTestFinished} from 'vitest';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync, readdirSync} from 'node:fs';

import {encryptionKey} from './fixtures.mjs';

export function createDatabase() {
    const sqlite = new DatabaseSync(':memory:');
    onTestFinished(() => sqlite.close());
    sqlite.exec('PRAGMA foreign_keys = ON');
    const migrations = new URL('../../migrations/', import.meta.url);
    for (const file of readdirSync(migrations).filter(file => file.endsWith('.sql')).sort()) {
        sqlite.exec(readFileSync(new URL(file, migrations), 'utf8'));
    }
    const normalize = row => {
        if (!row) return null;
        return Object.fromEntries(Object.entries(row).map(([key, value]) => [
            key, value instanceof Uint8Array ? Array.from(value) : value,
        ]));
    };
    // Only the D1 statement surface used by the repositories is adapted. SQL is real SQLite.
    const DB = {prepare(sql) {
        const statement = sqlite.prepare(sql);
        let values = [];
        return {
            bind(...args) {
                values = args.map(value => value instanceof ArrayBuffer ? new Uint8Array(value) : value);
                return this;
            },
            async first() { return normalize(statement.get(...values)); },
            async all() { return {success: true, results: statement.all(...values).map(normalize)}; },
            async run() {
                const result = statement.run(...values);
                return {success: true, meta: {changes: result.changes, last_row_id: result.lastInsertRowid}};
            },
        };
    }};
    return {sqlite, DB, env: {DB, ENCRYPTION_KEY: encryptionKey}};
}
