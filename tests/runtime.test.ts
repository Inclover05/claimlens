import test from 'node:test';
import assert from 'node:assert/strict';
import { postgresQuery, runWithRuntime, runtime, type RuntimeEnv } from '../lib/runtime.ts';

test('PostgreSQL parameters preserve quoted question marks and escaped quotes', () => {
 assert.equal(postgresQuery("SELECT '?' AS literal, \"?\" AS identifier FROM checks WHERE claim = ? AND source = ?"), "SELECT '?' AS literal, \"?\" AS identifier FROM checks WHERE claim = $1 AND source = $2");
 assert.equal(postgresQuery("SELECT 'isn''t ?' WHERE owner = ?"), "SELECT 'isn''t ?' WHERE owner = $1");
});
test('Worker database context is isolated between overlapping requests', async () => {
 const first = { GENLAYER_CONTRACT: 'first' } as RuntimeEnv;
 const second = { GENLAYER_CONTRACT: 'second' } as RuntimeEnv;
 const results = await Promise.all([
  runWithRuntime(first, async () => { await new Promise(resolve => setImmediate(resolve)); return runtime().GENLAYER_CONTRACT; }),
  runWithRuntime(second, async () => { await new Promise(resolve => setImmediate(resolve)); return runtime().GENLAYER_CONTRACT; }),
 ]);
 assert.deepEqual(results, ['first', 'second']);
 assert.notEqual(runtime(), first);
 assert.notEqual(runtime(), second);
});
