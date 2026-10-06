CREATE TABLE IF NOT EXISTS users (
 address TEXT PRIMARY KEY,
 username TEXT UNIQUE,
 created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS challenges (
 id TEXT PRIMARY KEY,
 address TEXT NOT NULL,
 message TEXT NOT NULL,
 expires_at INTEGER NOT NULL,
 consumed INTEGER NOT NULL DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS sessions (
 hash TEXT PRIMARY KEY,
 address TEXT NOT NULL,
 expires_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS checks (
 id TEXT PRIMARY KEY,
 owner TEXT NOT NULL,
 claim TEXT NOT NULL,
 source TEXT NOT NULL,
 visibility TEXT NOT NULL,
 topic TEXT NOT NULL,
 payload TEXT NOT NULL,
 input_hash TEXT NOT NULL,
 contract TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 state TEXT NOT NULL DEFAULT 'draft',
 evm_hash TEXT,
 gen_hash TEXT,
 verdict TEXT,
 result TEXT,
 error TEXT,
 updated_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS checks_owner ON checks (owner, created_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS checks_public ON checks (visibility, created_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS limits (
 key TEXT PRIMARY KEY,
 count INTEGER NOT NULL
);
