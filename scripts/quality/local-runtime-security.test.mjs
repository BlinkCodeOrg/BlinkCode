import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createLocalServerAuth,
  isLoopbackOrigin,
} from '../../server/localServerAuth.js';

test('local runtime accepts only configured loopback browser origins', () => {
  assert.equal(isLoopbackOrigin('http://127.0.0.1:5173', [5173]), true);
  assert.equal(isLoopbackOrigin('http://localhost:5173', [5173]), true);
  assert.equal(isLoopbackOrigin('https://example.com', [5173]), false);
  assert.equal(isLoopbackOrigin('http://127.0.0.1:9999', [5173]), false);
});

test('local runtime requires its session token for HTTP and WebSocket access', () => {
  const auth = createLocalServerAuth({
    getAllowedPorts: () => [3210],
    token: 'test-token',
  });
  const base = {
    headers: { origin: 'http://127.0.0.1:3210' },
    url: '/ws/terminal',
  };
  assert.equal(auth.authorizeWebSocket(base), false);
  assert.equal(
    auth.authorizeWebSocket({ ...base, url: '/ws/terminal?token=wrong' }),
    false,
  );
  assert.equal(
    auth.authorizeWebSocket({ ...base, url: '/ws/terminal?token=test-token' }),
    true,
  );
  assert.equal(
    auth.authorizeWebSocket({
      ...base,
      headers: { ...base.headers, authorization: 'Bearer test-token' },
    }),
    true,
  );
  assert.equal(
    auth.authorizeWebSocket({
      ...base,
      headers: {
        origin: 'https://example.com',
        authorization: 'Bearer test-token',
      },
    }),
    false,
  );
  assert.equal(
    auth.getAuthorizationHeaderForUrl('http://127.0.0.1:3210/api/tree'),
    'Bearer test-token',
  );
  assert.equal(
    auth.getAuthorizationHeaderForUrl('http://127.0.0.1:9999/api/tree'),
    null,
  );
  assert.equal(
    auth.getAuthorizationHeaderForUrl('https://example.com/api/tree'),
    null,
  );
});
