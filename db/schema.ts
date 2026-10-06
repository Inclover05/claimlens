// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const users = sqliteTable('users', { address:text('address').primaryKey(), username:text('username').unique(), createdAt:integer('created_at').notNull() });
export const challenges = sqliteTable('challenges', { id:text('id').primaryKey(), address:text('address').notNull(), message:text('message').notNull(), expiresAt:integer('expires_at').notNull(), consumed:integer('consumed').notNull().default(0) });
export const sessions = sqliteTable('sessions', { hash:text('hash').primaryKey(), address:text('address').notNull(), expiresAt:integer('expires_at').notNull() });
export const checks = sqliteTable('checks', {
 id:text('id').primaryKey(), owner:text('owner').notNull(), claim:text('claim').notNull(), source:text('source').notNull(), visibility:text('visibility').notNull(), topic:text('topic').notNull(), payload:text('payload').notNull(), inputHash:text('input_hash').notNull(), contract:text('contract').notNull(), createdAt:integer('created_at').notNull(), state:text('state').notNull().default('draft'), evmHash:text('evm_hash'), genHash:text('gen_hash'), verdict:text('verdict'), result:text('result'), error:text('error'), updatedAt:integer('updated_at').notNull(),
}, t => [index('checks_owner').on(t.owner,t.createdAt),index('checks_public').on(t.visibility,t.createdAt)]);
export const limits = sqliteTable('limits', { key:text('key').primaryKey(), count:integer('count').notNull() });
