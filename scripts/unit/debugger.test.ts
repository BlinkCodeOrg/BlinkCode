import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { NodeDebugSession } from '../../server/debugger/NodeDebugSession.js';
import { formatCallFrames } from '../../server/debugger/formatCallFrames.js';
import { resolveInspectorUrl } from '../../server/debugger/resolveInspectorUrl.js';
import { parseJsonc } from '../../server/debugger/parseJsonc.js';
import { resolveDebugConfiguration } from '../../server/debugger/resolveDebugConfiguration.js';
import { createDefaultLaunchConfiguration } from '../../server/debugger/createDefaultLaunchConfiguration.js';
import { loadDebugConfigurations } from '../../server/debugger/loadDebugConfigurations.js';

test('formats inspector call frames as workspace-relative locations', () => {
  const workspace = join(tmpdir(), 'blinkcode-debug-workspace');
  const frames = formatCallFrames(
    [
      {
        callFrameId: 'frame-1',
        functionName: 'run',
        url: new URL(
          `file:///${join(workspace, 'src/index.js').replace(/\\/g, '/')}`,
        ).href,
        location: { lineNumber: 4, columnNumber: 2 },
        scopeChain: [{ type: 'local', object: { objectId: 'scope-1' } }],
      },
    ],
    workspace,
  );

  assert.equal(frames[0].path, 'src/index.js');
  assert.equal(frames[0].line, 5);
  assert.equal(frames[0].scopes[0].objectId, 'scope-1');
});

test('parses BlinkCode JSONC launch configurations and resolves workspace variables', () => {
  const workspace = join(tmpdir(), 'blinkcode-launch-workspace');
  const document = parseJsonc(`{
    // BlinkCode debug files accept comments and trailing commas.
    "version": "1.0",
    "configurations": [{
      "name": "Launch app",
      "type": "pwa-node",
      "request": "launch",
      "program": "\${workspaceRoot}/src/index.js",
      "args": ["\${relativeFile}",],
    }],
  }`);
  const configuration = resolveDebugConfiguration(
    document.configurations[0],
    workspace,
    'src/index.js',
  );
  assert.equal(configuration.type, 'node');
  assert.equal(configuration.program, join(workspace, 'src/index.js'));
  assert.deepEqual(configuration.args, ['src/index.js']);
});

test('creates and loads only the BlinkCode-owned debug configuration path', async () => {
  const workspace = mkdtempSync(join(tmpdir(), 'blinkcode-config-path-'));
  try {
    const beforeCreate = await loadDebugConfigurations(workspace);
    assert.equal(beforeCreate.exists, false);
    assert.equal(beforeCreate.path, '.blinkcode/launch.json');

    const created = await createDefaultLaunchConfiguration(workspace, 'app.js');
    assert.equal(created[0].name, 'Launch current file');
    assert.equal(
      existsSync(join(workspace, '.blinkcode', 'launch.json')),
      true,
    );

    const loaded = await loadDebugConfigurations(workspace);
    assert.equal(loaded.exists, true);
    assert.equal(loaded.path, '.blinkcode/launch.json');
    assert.equal(loaded.configurations[0].program, 'app.js');
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test(
  'Node debugger pauses at a breakpoint and exposes local variables',
  { timeout: 30_000 },
  async () => {
    const workspace = mkdtempSync(join(tmpdir(), 'blinkcode-debug-'));
    writeFileSync(
      join(workspace, 'sample.js'),
      [
        'const value = 2;',
        "const nested = { answer: 42, label: 'BlinkCode' };",
        'const doubled = value * 2;',
        'console.log(nested.label, doubled);',
      ].join('\n'),
    );
    const session = new NodeDebugSession(workspace);

    try {
      await session.start('sample.js', [4]);
      // Fresh Windows CI runners can spend several seconds starting the Node
      // inspector. CDP may also resolve the breakpoint to the next executable
      // line, so wait for the reported pause rather than an exact source line.
      const deadline = Date.now() + 20_000;
      while (Date.now() < deadline && session.snapshot().status !== 'paused') {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      const frame = session.snapshot().callFrames[0];
      assert.equal(session.snapshot().status, 'paused');
      assert.equal(frame.path, 'sample.js');
      assert.equal(frame.line, 4);
      const localScope = frame.scopes.find((scope) => scope.type === 'local');
      const variables = await session.variables(localScope?.objectId);
      assert.equal(
        variables.find((variable) => variable.name === 'value')?.value,
        '2',
      );
      const evaluation = await session.evaluate('value + 1', frame.id);
      assert.equal(evaluation.value, '3');
      const objectEvaluation = await session.evaluate('nested', frame.id);
      assert.equal(objectEvaluation.type, 'object');
      assert.ok(objectEvaluation.objectId);
      const objectProperties = await session.variables(
        objectEvaluation.objectId,
      );
      assert.equal(
        objectProperties.find((variable) => variable.name === 'answer')?.value,
        '42',
      );
      assert.equal(
        objectProperties.find((variable) => variable.name === 'label')?.value,
        'BlinkCode',
      );
      await assert.rejects(
        session.evaluate('missingBlinkCodeValue', frame.id),
        /missingBlinkCodeValue is not defined/,
      );
      await assert.rejects(
        session.evaluate('const =', frame.id),
        /SyntaxError|Unexpected token/,
      );
      const consoleOutput = session
        .snapshot()
        .output.filter((line) => line.stream === 'console')
        .map((line) => line.text)
        .join('');
      assert.match(consoleOutput, /> value \+ 1/);
      assert.match(consoleOutput, /> nested/);
      const cleared = session.clearOutput();
      assert.deepEqual(cleared.output, []);
    } finally {
      await session.stop();
      await new Promise((resolve) => setTimeout(resolve, 100));
      rmSync(workspace, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 100,
      });
    }
  },
);

test('Node debugger accepts CDP-resolved breakpoint locations', () => {
  const workspace = join(tmpdir(), 'blinkcode-resolved-breakpoint');
  const session = new NodeDebugSession(workspace);
  session.stopOnEntry = false;
  session.initialPauseHandled = false;
  session.state.breakpointDetails = [
    {
      enabled: true,
      path: 'sample.js',
      line: 3,
      inspectorId: 'breakpoint-1',
    },
  ];

  session.handleInspectorEvent(
    JSON.stringify({
      method: 'Debugger.paused',
      params: {
        reason: 'other',
        hitBreakpoints: ['breakpoint-1'],
        callFrames: [
          {
            callFrameId: 'frame-1',
            functionName: 'run',
            url: new URL(
              `file:///${join(workspace, 'sample.js').replace(/\\/g, '/')}`,
            ).href,
            location: { lineNumber: 3, columnNumber: 0 },
            scopeChain: [],
          },
        ],
      },
    }),
  );

  assert.equal(session.snapshot().status, 'paused');
  assert.equal(session.snapshot().callFrames[0].line, 4);
});

test(
  'launch configuration passes arguments and environment and can restart',
  { timeout: 20_000 },
  async () => {
    const workspace = mkdtempSync(join(tmpdir(), 'blinkcode-debug-config-'));
    writeFileSync(
      join(workspace, 'configured.js'),
      [
        'const marker = `${process.env.BLINK_DEBUG_ENV}:${process.argv[2]}`;',
        'console.log(marker);',
      ].join('\n'),
    );
    const session = new NodeDebugSession(workspace);
    const configuration = {
      name: 'Configured launch',
      request: 'launch',
      type: 'node',
      program: join(workspace, 'configured.js'),
      cwd: workspace,
      runtimeExecutable: process.execPath,
      runtimeArgs: [],
      args: ['argument'],
      env: { BLINK_DEBUG_ENV: 'environment' },
      stopOnEntry: false,
    };

    try {
      await session.startConfiguration(configuration, [
        { path: 'configured.js', line: 1, enabled: true },
      ]);
      const pausedDeadline = Date.now() + 8_000;
      while (
        session.snapshot().status !== 'paused' &&
        Date.now() < pausedDeadline
      ) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      assert.equal(session.snapshot().sessionName, 'Configured launch');
      assert.equal(session.snapshot().breakpointDetails[0].verified, true);
      await session.command('continue');
      const outputDeadline = Date.now() + 5_000;
      while (
        !session
          .snapshot()
          .output.some((line) => line.text.includes('environment:argument')) &&
        Date.now() < outputDeadline
      ) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      assert.match(
        session
          .snapshot()
          .output.map((line) => line.text)
          .join(''),
        /environment:argument/,
      );

      const restarted = await session.restart();
      assert.equal(restarted.sessionName, 'Configured launch');
      assert.equal(restarted.status, 'starting');
    } finally {
      await session.stop();
      await new Promise((resolve) => setTimeout(resolve, 100));
      rmSync(workspace, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 100,
      });
    }
  },
);

test('inspector URL resolver keeps direct WebSocket endpoints', async () => {
  assert.equal(
    await resolveInspectorUrl('ws://127.0.0.1:9229/session'),
    'ws://127.0.0.1:9229/session',
  );
});

test('failed debugger attach leaves a controllable failed session', async () => {
  const session = new NodeDebugSession(tmpdir());
  await assert.rejects(session.attach('127.0.0.1:9'), /Cannot reach Inspector/);
  assert.equal(session.snapshot().status, 'failed');
  assert.equal(session.snapshot().connected, false);
  await assert.rejects(session.command('pause'), /not connected/);
});

test(
  'attaches to an existing Node inspector and can pause it',
  { timeout: 15_000 },
  async () => {
    const child = spawn(
      process.execPath,
      ['--inspect=0', '-e', 'setInterval(() => {}, 1000)'],
      {
        stdio: ['ignore', 'ignore', 'pipe'],
      },
    );
    const session = new NodeDebugSession(tmpdir());
    try {
      const inspectorUrl = await new Promise<string>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error('Inspector URL timeout')),
          8_000,
        );
        child.stderr.on('data', (chunk) => {
          const match = String(chunk).match(
            /Debugger listening on (ws:\/\/[^\s]+)/,
          );
          if (match) {
            clearTimeout(timer);
            resolve(match[1]);
          }
        });
      });
      const attached = await session.attach(inspectorUrl);
      assert.equal(attached.status, 'running');
      assert.equal(attached.connected, true);
      await session.command('pause');
      const deadline = Date.now() + 5_000;
      while (session.snapshot().status !== 'paused' && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      assert.equal(session.snapshot().status, 'paused');
    } finally {
      await session.stop();
      child.kill();
    }
  },
);
