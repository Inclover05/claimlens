import { AsyncLocalStorage } from 'node:async_hooks';
import { neon } from '@neondatabase/serverless';

export interface Statement {
 bind(...values: unknown[]): Statement;
 first<T = Record<string, unknown>>(): Promise<T | null>;
 all(): Promise<{ results: Record<string, unknown>[] }>;
 run(): Promise<unknown>;
}
export interface Database {
 prepare(query: string): Statement;
 batch(statements: Statement[]): Promise<unknown[]>;
}
export type RuntimeEnv = { DB: Database; GENLAYER_CONTRACT?: string; BRAVE_SEARCH_API_KEY?: string };
const requests = new AsyncLocalStorage<RuntimeEnv>();
export function runWithRuntime<T>(env: RuntimeEnv, run: () => T): T {
 return requests.run(env, run);
}

// Only replace placeholders outside SQL string literals. All SQL is authored by the app.
export function postgresQuery(query: string): string {
 let quote = '', parameter = 0, result = '';
 for (let i = 0; i < query.length; i++) {
  const char = query[i];
  if (quote) {
   result += char;
   if (char === quote) {
    if (query[i + 1] === quote) result += query[++i];
    else quote = '';
   }
  } else if (char === "'" || char === '"') { quote = char; result += char; }
  else result += char === '?' ? `$${++parameter}` : char;
 }
 return result;
}
function createDatabase(url: string): Database {
 const sql = neon(url);
 class Prepared implements Statement {
  readonly query: string;
  readonly values: unknown[];
  constructor(query: string, values: unknown[] = []) { this.query = query; this.values = values; }
  bind(...values: unknown[]) { return new Prepared(this.query, values); }
  async all() { return { results: await sql.query(this.query, this.values) as Record<string, unknown>[] }; }
  async first<T = Record<string, unknown>>() { return (await this.all()).results[0] as T ?? null; }
  async run() { return this.all(); }
 }
 return {
  prepare: query => new Prepared(postgresQuery(query)),
  async batch(statements) {
   const queries = statements.map(statement => {
    if (!(statement instanceof Prepared)) throw new Error('Invalid database statement.');
    return sql.query(statement.query, statement.values);
   });
   return sql.transaction(queries);
  },
 };
}
let database: Database | undefined;
const nodeEnv: RuntimeEnv = {
 get DB() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('Saved checks are temporarily unavailable.');
  return database ??= createDatabase(url);
 },
 get GENLAYER_CONTRACT() { return process.env.GENLAYER_CONTRACT; },
 get BRAVE_SEARCH_API_KEY() { return process.env.BRAVE_SEARCH_API_KEY; },
};
export function runtime(): RuntimeEnv { return requests.getStore() ?? nodeEnv; }


export function usesVercelProxy(): boolean { return !requests.getStore() && process.env.VERCEL === '1'; }
