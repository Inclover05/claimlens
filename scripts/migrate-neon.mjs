import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';
if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL before running the migration.');
const sql = neon(process.env.DATABASE_URL);
const migration = await readFile(new URL('../db/postgres.sql', import.meta.url), 'utf8');
const statements = migration.replace(/^\uFEFF/, '').split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);
await sql.transaction(statements.map(statement => sql.query(statement)));
console.log('ClaimLens PostgreSQL schema is ready.');
