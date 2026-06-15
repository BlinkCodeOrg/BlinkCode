import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import { executeHttpRequest } from '../../server/restClient/executeHttpRequest.js';
import { parseHttpDocument } from '../../server/restClient/parseHttpDocument.js';

test('parses HTTP documents with variables, headers, bodies and separators', () => {
  const requests = parseHttpDocument([
    '@host = https://example.com',
    'GET {{host}}/health',
    'Accept: application/json',
    '',
    '### create',
    'POST {{host}}/items',
    'Content-Type: application/json',
    '',
    '{"name":"Blink"}',
  ].join('\n'));

  assert.equal(requests.length, 2);
  assert.equal(requests[0].url, 'https://example.com/health');
  assert.equal(requests[0].headers.Accept, 'application/json');
  assert.equal(requests[1].body, '{"name":"Blink"}');
});

test('executes HTTP requests and captures response metadata', async () => {
  const server = createServer((_request, response) => {
    response.setHeader('Content-Type', 'application/json');
    response.end('{"ok":true}');
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert(address && typeof address === 'object');

  try {
    const response = await executeHttpRequest({
      method: 'GET',
      url: `http://127.0.0.1:${address.port}/health`,
      headers: {},
      body: null,
    });
    assert.equal(response.status, 200);
    assert.equal(response.body, '{"ok":true}');
    assert.equal(response.headers['content-type'], 'application/json');
  } finally {
    server.close();
  }
});
