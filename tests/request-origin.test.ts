import test from 'node:test';
import assert from 'node:assert/strict';
import { publicRequestUrl, isSameOrigin } from '../lib/request-origin.ts';

test('Next internal hostname does not replace the browser origin', () => {
 const req = new Request('http://localhost:5173/api/auth/nonce', { headers: { host: '127.0.0.1:5173', origin: 'http://127.0.0.1:5173' } });
 assert.equal(publicRequestUrl(req).origin, 'http://127.0.0.1:5173');
 assert.equal(isSameOrigin(req), true);
});
test('cross-origin requests and absent origins remain blocked', () => {
 assert.equal(isSameOrigin(new Request('https://app.example/api', { headers: { host: 'app.example', origin: 'https://evil.example' } })), false);
 assert.equal(isSameOrigin(new Request('https://app.example/api')), false);
});
test('Vercel proxy preserves the public HTTPS domain', () => {
 const req = new Request('http://localhost/api', { headers: { host: 'localhost', 'x-forwarded-host': 'claimlens.example', 'x-forwarded-proto': 'https', origin: 'https://claimlens.example' } });
 assert.equal(publicRequestUrl(req, true).origin, 'https://claimlens.example');
 assert.equal(isSameOrigin(req, true), true);
 assert.equal(isSameOrigin(req, false), false);
});
test('malformed host and protocol cannot become a trusted origin', () => {
 for (const host of ['app.example/evil', 'user@app.example', 'app.example,evil.example']) {
  assert.equal(isSameOrigin(new Request('https://app.example/api', { headers: { host, origin: 'https://app.example' } })), false);
 }
 assert.equal(isSameOrigin(new Request('http://localhost/api', { headers: { 'x-forwarded-proto': 'https, http', origin: 'https://localhost' } }), true), false);
});
