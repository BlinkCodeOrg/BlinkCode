import crypto from 'node:crypto';

const LOOPBACK_HOSTS = new Set(['127.0.0.1', '::1', 'localhost']);

function readBearerToken(header) {
  const match = /^Bearer\s+(.+)$/i.exec(String(header || ''));
  return match?.[1] || '';
}

function tokensMatch(expected, actual) {
  const left = Buffer.from(String(expected || ''));
  const right = Buffer.from(String(actual || ''));
  return (
    left.length > 0 &&
    left.length === right.length &&
    crypto.timingSafeEqual(left, right)
  );
}

export function isLoopbackOrigin(rawOrigin, allowedPorts = []) {
  try {
    const origin = new URL(String(rawOrigin || ''));
    const port = origin.port || (origin.protocol === 'https:' ? '443' : '80');
    return (
      ['http:', 'https:'].includes(origin.protocol) &&
      LOOPBACK_HOSTS.has(origin.hostname) &&
      allowedPorts.map(String).includes(port)
    );
  } catch {
    return false;
  }
}

export function createLocalServerAuth({
  getAllowedPorts,
  token = crypto.randomBytes(32).toString('base64url'),
}) {
  const originAllowed = (request) =>
    isLoopbackOrigin(request.headers.origin, getAllowedPorts());
  const tokenAllowed = (request) => {
    const url = new URL(request.url || '/', 'http://127.0.0.1');
    const candidate =
      readBearerToken(request.headers.authorization) ||
      url.searchParams.get('token');
    return tokensMatch(token, candidate);
  };

  const issueSession = (request, response) => {
    if (!originAllowed(request)) {
      response.status(403).json({ error: 'Untrusted BlinkCode client origin' });
      return;
    }
    response.setHeader('Cache-Control', 'no-store');
    response.json({ token });
  };

  const requireApiSession = (request, response, next) => {
    const suppliedOrigin = request.headers.origin;
    if (!tokenAllowed(request) || (suppliedOrigin && !originAllowed(request))) {
      response.status(401).json({ error: 'Valid BlinkCode session required' });
      return;
    }
    next();
  };

  const authorizeWebSocket = (request) =>
    originAllowed(request) && tokenAllowed(request);

  const getAuthorizationHeaderForUrl = (rawUrl) => {
    try {
      const url = new URL(rawUrl);
      const port = url.port || (url.protocol === 'https:' ? '443' : '80');
      if (!['http:', 'https:'].includes(url.protocol)) return null;
      if (
        !LOOPBACK_HOSTS.has(url.hostname) ||
        !getAllowedPorts().map(String).includes(port)
      )
        return null;
      return `Bearer ${token}`;
    } catch {
      return null;
    }
  };

  return {
    authorizeWebSocket,
    getAuthorizationHeaderForUrl,
    issueSession,
    requireApiSession,
  };
}
