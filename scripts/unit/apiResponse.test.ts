import assert from 'node:assert/strict';
import test from 'node:test';
import { parseApiResponse } from '../../src/features/apiClient/parseApiResponse';

test('parses JSON API responses', () => {
  assert.deepEqual(parseApiResponse('{"status":"idle"}', 'application/json; charset=utf-8'), { status: 'idle' });
});

test('explains stale backend HTML responses', () => {
  assert.throws(
    () => parseApiResponse('<!doctype html><html></html>', 'text/html'),
    /returned the app page.*Restart the backend/,
  );
});

test('rejects malformed or unsupported API responses', () => {
  assert.throws(() => parseApiResponse('{bad', 'application/json'), /malformed JSON/);
  assert.throws(() => parseApiResponse('plain text', 'text/plain'), /unsupported response type/);
});
