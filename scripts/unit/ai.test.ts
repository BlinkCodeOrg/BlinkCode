import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { buildAiContextMessage } from '../../server/ai/buildAiContextMessage.js';
import { executeAgentTool } from '../../server/ai/executeAgentTool.js';
import { parseAgentPlan } from '../../server/ai/parseAgentPlan.js';
import { requestAiCompletion } from '../../server/ai/requestAiCompletion.js';
import { checkAiProvider } from '../../server/ai/checkAiProvider.js';
import { consumeAiToolApproval, createAiToolApproval } from '../../server/ai/aiToolApprovals.js';

test('builds bounded editor context and parses agent tool plans', () => {
  const context = buildAiContextMessage({
    activeFile: { path: 'src/app.ts', language: 'typescript', content: 'export const app = true;' },
    selection: 'app',
    openFiles: ['src/app.ts'],
    workspaceFiles: ['src/app.ts', 'package.json'],
  });
  assert.match(context, /Active file: src\/app\.ts/);
  assert.match(context, /Selected code/);
  const tools = parseAgentPlan('```json\n{"tools":[{"name":"read_file","arguments":{"path":"src/app.ts"}}]}\n```');
  assert.equal(tools[0].name, 'read_file');
});

test('calls an OpenAI-compatible provider', async () => {
  const server = createServer(async (request, response) => {
    let body = '';
    for await (const chunk of request) body += chunk;
    assert.equal(JSON.parse(body).model, 'test-model');
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify({ model: 'test-model', choices: [{ message: { content: 'const answer = 42;' } }] }));
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert(address && typeof address === 'object');
  try {
    const result = await requestAiCompletion(
      { baseUrl: `http://127.0.0.1:${address.port}/v1`, model: 'test-model', apiKey: '' },
      [{ role: 'user', content: 'complete' }],
    );
    assert.equal(result.content, 'const answer = 42;');
  } finally {
    server.close();
  }
});

test('reports provider availability without throwing gateway errors', async () => {
  const server = createServer((_request, response) => {
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify({ data: [{ id: 'test-model' }] }));
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert(address && typeof address === 'object');
  try {
    const available = await checkAiProvider({ baseUrl: `http://127.0.0.1:${address.port}/v1` });
    assert.equal(available.connected, true);
    assert.deepEqual(available.models, ['test-model']);
  } finally {
    server.close();
  }

  const unavailable = await checkAiProvider({ baseUrl: 'http://127.0.0.1:9/v1' });
  assert.equal(unavailable.connected, false);
  assert.match(unavailable.error, /Cannot reach/);
});

test('AI tools keep reads safe and require confirmation for writes', async () => {
  const workspace = mkdtempSync(join(tmpdir(), 'blinkcode-ai-'));
  writeFileSync(join(workspace, 'source.txt'), 'before');
  try {
    const read = await executeAgentTool(workspace, { name: 'read_file', arguments: { path: 'source.txt' } });
    assert.equal(read.content, 'before');
    await assert.rejects(
      executeAgentTool(workspace, { name: 'write_file', arguments: { path: 'source.txt', content: 'after' } }, false),
      /Confirmation/,
    );
    await executeAgentTool(workspace, { name: 'write_file', arguments: { path: 'source.txt', content: 'after' } }, true);
    assert.equal(readFileSync(join(workspace, 'source.txt'), 'utf8'), 'after');
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test('AI mutation approvals are single-use and bound to the reviewed tool', () => {
  const tool = { name: 'write_file', arguments: { path: 'a.txt', content: 'safe' } };
  const token = createAiToolApproval(tool);
  assert.equal(consumeAiToolApproval(token, { ...tool, arguments: { ...tool.arguments, content: 'changed' } }), false);
  const second = createAiToolApproval(tool);
  assert.equal(consumeAiToolApproval(second, tool), true);
  assert.equal(consumeAiToolApproval(second, tool), false);
});
