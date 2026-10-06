import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createClient } from 'genlayer-js';
import { testnetBradbury } from 'genlayer-js/chains';
import { deploymentData } from '../scripts/deploy-bradbury.mjs';

test('deployment encoding matches the pinned SDK without broadcasting', async () => {
  const address = '0x00000000000000000000000000000000000000ab';
  const source = new Uint8Array(await readFile(new URL('../contracts/claimlens.py', import.meta.url)));
  const originalFetch = globalThis.fetch;
  const originalNow = Date.now;
  const originalWarn = console.warn;
  const timestamp = 1791310000000;
  let captured: { data: string; from: string; to: string } | undefined;
  try {
    Date.now = () => timestamp;
    console.warn = () => {};
    globalThis.fetch = async (_input, init) => {
      const request = JSON.parse(String(init?.body));
      const replies: Record<string, string> = { eth_getTransactionCount: '0x0', eth_estimateGas: '0x100000', eth_gasPrice: '0x1' };
      assert.ok(request.method in replies, `Unexpected RPC method: ${request.method}`);
      return new Response(JSON.stringify({ jsonrpc: '2.0', id: request.id, result: replies[request.method] }));
    };
    const client = createClient({
      chain: testnetBradbury, account: address,
      provider: { request: async ({ method, params }: { method: string; params?: unknown[] }) => {
        if (method === 'eth_chainId') return '0x107d';
        assert.equal(method, 'eth_sendTransaction');
        captured = params?.[0] as typeof captured;
        throw Object.assign(new Error('Test stops before signing or sending'), { code: 4001 });
      } },
    });
    await assert.rejects(client.deployContract({ code: source, args: [], leaderOnly: false }), /Test stops before signing/);
    assert.ok(captured);
    assert.equal(captured.from, address);
    assert.equal(captured.to, testnetBradbury.consensusMainContract!.address);
    assert.equal(captured.data, deploymentData(address, source, Math.floor(timestamp / 1000) + 3600));
  } finally {
    globalThis.fetch = originalFetch;
    Date.now = originalNow;
    console.warn = originalWarn;
  }
});
