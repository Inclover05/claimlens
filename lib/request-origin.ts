// Use the incoming host for wallet messages and CSRF checks, not Next's internal URL.
// Forwarded headers are trusted only when the caller is running on Vercel.
export function publicRequestUrl(req: Request, trustVercelProxy = false): URL {
 const url = new URL(req.url);
 const host = (trustVercelProxy ? req.headers.get('x-forwarded-host') : null) ?? req.headers.get('host');
 const protocol = trustVercelProxy ? req.headers.get('x-forwarded-proto') : null;
 if (protocol) {
  if (protocol !== 'https' && protocol !== 'http') throw new TypeError('Invalid request protocol.');
  url.protocol = protocol + ':';
 }
 if (host) {
  if (!/^(?:[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?|\[[0-9a-f:]+\])(?::[0-9]{1,5})?$/i.test(host)) throw new TypeError('Invalid request host.');
  const authority = new URL(`${url.protocol}//${host}`);
  url.host = authority.host;
 }
 return url;
}
export function isSameOrigin(req: Request, trustVercelProxy = false): boolean {
 try { return req.headers.get('origin') === publicRequestUrl(req, trustVercelProxy).origin; }
 catch { return false; }
}
