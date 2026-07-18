import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import path from 'path';
import { pathToFileURL } from 'url';
import WebSocket from 'ws';
import { formatCallFrames } from './formatCallFrames.js';
import { createInspectorRequest } from './inspectorRequest.js';
import { resolveInspectorUrl } from './resolveInspectorUrl.js';

export class NodeDebugSession extends EventEmitter {
  constructor(workspaceRoot) {
    super();
    this.workspaceRoot = workspaceRoot;
    this.child = null;
    this.socket = null;
    this.inspector = null;
    this.scriptUrls = new Map();
    this.initialPauseHandled = false;
    this.lastRequest = null;
    this.state = {
      status: 'idle',
      connected: false,
      breakpoints: [],
      breakpointDetails: [],
      callFrames: [],
      output: [],
    };
  }

  snapshot() {
    return this.state;
  }

  update(patch) {
    this.state = { ...this.state, ...patch };
    this.emit('state', this.state);
  }

  appendOutput(stream, text) {
    const output = [...this.state.output, { stream, text: String(text) }].slice(-300);
    this.update({ output });
  }

  async start(relativePath, breakpoints = []) {
    return this.launch({
      name: 'Current File',
      type: 'node',
      request: 'launch',
      program: path.resolve(this.workspaceRoot, relativePath),
      cwd: this.workspaceRoot,
      runtimeExecutable: process.execPath,
      runtimeArgs: [],
      args: [],
      env: {},
      stopOnEntry: false,
    }, breakpoints);
  }

  async startConfiguration(configuration, breakpoints = []) {
    if (configuration.request === 'attach') {
      const endpoint = configuration.webSocketUrl || `${configuration.address}:${configuration.port}`;
      return this.attach(endpoint, breakpoints, configuration);
    }
    return this.launch(configuration, breakpoints);
  }

  async launch(configuration, breakpoints = []) {
    await this.stop();
    const fullPath = path.resolve(configuration.program || '');
    const relative = path.relative(this.workspaceRoot, fullPath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('INVALID_PATH');

    const normalizedBreakpoints = this.normalizeBreakpoints(breakpoints, relative.replace(/\\/g, '/'));
    this.lastRequest = { mode: 'launch', configuration, breakpoints: normalizedBreakpoints };
    this.update({
      status: 'starting',
      connected: false,
      sessionName: configuration.name,
      request: 'launch',
      filePath: relative.replace(/\\/g, '/'),
      breakpoints: normalizedBreakpoints.filter(item => item.enabled).map(item => item.line),
      breakpointDetails: normalizedBreakpoints,
      callFrames: [],
      output: [],
      error: null,
    });
    this.scriptUrls.clear();
    this.initialPauseHandled = false;
    const executable = configuration.runtimeExecutable || process.execPath;
    const child = spawn(executable, [
      ...(configuration.runtimeArgs || []),
      '--inspect-brk=0',
      fullPath,
      ...(configuration.args || []),
    ], {
      cwd: configuration.cwd || this.workspaceRoot,
      env: { ...process.env, ...(configuration.env || {}) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    this.child = child;
    child.stdout.on('data', data => this.appendOutput('stdout', data));
    child.stderr.on('data', data => {
      const text = String(data);
      this.appendOutput('stderr', text);
      const match = text.match(/Debugger listening on (ws:\/\/[^\s]+)/);
      if (match && !this.socket) {
        this.connect(match[1], {
          breakpoints: normalizedBreakpoints,
          runIfWaitingForDebugger: true,
          stopOnEntry: configuration.stopOnEntry,
        }).catch(error => this.fail(error));
      }
    });
    child.on('error', error => this.fail(error));
    child.on('exit', exitCode => {
      this.cleanupInspector();
      this.child = null;
      this.update({ status: 'stopped', connected: false, exitCode, callFrames: [] });
    });
    return this.state;
  }

  async attach(endpoint, breakpoints = [], configuration = null) {
    await this.stop();
    const normalizedBreakpoints = this.normalizeBreakpoints(breakpoints);
    this.lastRequest = { mode: 'attach', endpoint, configuration, breakpoints: normalizedBreakpoints };
    this.update({
      status: 'starting',
      connected: false,
      sessionName: configuration?.name || 'Attach',
      request: 'attach',
      attachEndpoint: endpoint,
      breakpoints: [],
      breakpointDetails: normalizedBreakpoints,
      callFrames: [],
      output: [],
      error: null,
    });
    this.scriptUrls.clear();
    this.initialPauseHandled = true;
    try {
      const url = await resolveInspectorUrl(endpoint);
      await this.connect(url, { breakpoints: normalizedBreakpoints });
      return this.state;
    } catch (error) {
      this.cleanupInspector();
      this.update({ status: 'failed', connected: false, error: error?.message || String(error) });
      throw error;
    }
  }

  async connect(url, {
    breakpoints = [],
    runIfWaitingForDebugger = false,
    stopOnEntry = false,
  } = {}) {
    const socket = new WebSocket(url);
    this.socket = socket;
    await new Promise((resolve, reject) => {
      socket.once('open', resolve);
      socket.once('error', reject);
    });
    const inspector = createInspectorRequest(socket);
    this.inspector = inspector;
    socket.on('message', raw => this.handleInspectorEvent(raw));
    socket.on('close', () => this.cleanupInspector());

    await inspector.request('Runtime.enable');
    await inspector.request('Debugger.enable');
    const breakpointDetails = await this.installBreakpoints(breakpoints);
    this.update({ status: 'running', connected: true, error: null });
    this.update({ breakpointDetails });
    this.stopOnEntry = stopOnEntry;
    if (runIfWaitingForDebugger) await inspector.request('Runtime.runIfWaitingForDebugger');
  }

  handleInspectorEvent(raw) {
    let message;
    try {
      message = JSON.parse(String(raw));
    } catch {
      return;
    }
    if (message.method === 'Debugger.paused') {
      const callFrames = (message.params?.callFrames || []).map(frame => ({
        ...frame,
        url: frame.url || this.scriptUrls.get(frame.location?.scriptId) || '',
      }));
      const formattedFrames = formatCallFrames(callFrames, this.workspaceRoot);
      const firstFrame = formattedFrames[0];
      if (!this.initialPauseHandled) {
        this.initialPauseHandled = true;
        const hitBreakpoints = new Set(message.params?.hitBreakpoints || []);
        const hasBreakpoint = this.state.breakpointDetails.some(item => (
          item.enabled && (
            (item.inspectorId && hitBreakpoints.has(item.inspectorId))
            || (item.path === firstFrame?.path && item.line === firstFrame?.line)
          )
        ));
        if (!this.stopOnEntry && !hasBreakpoint) {
          this.inspector?.request('Debugger.resume').catch(error => this.fail(error));
          return;
        }
      }
      this.update({
        status: 'paused',
        pauseReason: message.params?.reason || 'breakpoint',
        callFrames: formattedFrames,
      });
    }
    if (message.method === 'Debugger.scriptParsed' && message.params?.scriptId) {
      this.scriptUrls.set(message.params.scriptId, message.params.url || '');
    }
    if (message.method === 'Debugger.resumed') {
      this.update({ status: 'running', callFrames: [], pauseReason: null });
    }
  }

  async command(command) {
    if (command === 'stop') {
      await this.stop();
      return this.state;
    }
    if (!this.inspector) throw new Error('Debugger is not connected');
    const methods = {
      continue: 'Debugger.resume',
      pause: 'Debugger.pause',
      stepOver: 'Debugger.stepOver',
      stepInto: 'Debugger.stepInto',
      stepOut: 'Debugger.stepOut',
    };
    const method = methods[command];
    if (!method) throw new Error('Unsupported debugger command');
    await this.inspector.request(method);
    return this.state;
  }

  async restart() {
    const request = this.lastRequest;
    if (!request) throw new Error('No debug session to restart');
    if (request.mode === 'attach') {
      return this.attach(request.endpoint, request.breakpoints, request.configuration);
    }
    return this.launch(request.configuration, request.breakpoints);
  }

  async variables(objectId) {
    if (!this.inspector || !objectId) return [];
    const result = await this.inspector.request('Runtime.getProperties', {
      objectId,
      ownProperties: true,
      generatePreview: true,
    });
    return (result.result || []).map(property => ({
      name: property.name,
      type: property.value?.type || property.get?.type || 'unknown',
      value: property.value?.description ?? property.value?.value ?? '(unavailable)',
      objectId: property.value?.objectId || null,
    }));
  }

  async evaluate(expression, callFrameId = '') {
    if (!this.inspector) throw new Error('Debugger is not connected');
    if (!String(expression || '').trim()) throw new Error('Expression is required');
    const method = callFrameId ? 'Debugger.evaluateOnCallFrame' : 'Runtime.evaluate';
    const params = callFrameId
      ? { callFrameId, expression, generatePreview: true, throwOnSideEffect: false }
      : { expression, generatePreview: true, awaitPromise: true, replMode: true };
    const response = await this.inspector.request(method, params);
    if (response.exceptionDetails) {
      throw new Error(response.result?.description || response.exceptionDetails.exception?.description || response.exceptionDetails.text || 'Evaluation failed');
    }
    const result = response.result || {};
    const value = {
      name: expression,
      type: result.type || 'unknown',
      value: result.description ?? result.value ?? 'undefined',
      objectId: result.objectId || null,
    };
    this.appendOutput('console', `> ${expression}\n${String(value.value)}\n`);
    return value;
  }

  clearOutput() {
    this.update({ output: [] });
    return this.state;
  }

  normalizeBreakpoints(breakpoints, defaultPath = '') {
    return (Array.isArray(breakpoints) ? breakpoints : []).map((breakpoint, index) => {
      const source = typeof breakpoint === 'number' ? { line: breakpoint } : breakpoint;
      return {
        id: String(source.id || `${source.path || defaultPath}:${source.line}:${index}`),
        path: String(source.path || defaultPath).replace(/\\/g, '/'),
        line: Math.max(1, Number(source.line || 1)),
        enabled: source.enabled !== false,
        condition: source.condition ? String(source.condition) : '',
        verified: false,
      };
    });
  }

  async installBreakpoints(breakpoints) {
    const installed = [];
    for (const breakpoint of breakpoints) {
      if (!breakpoint.enabled || !breakpoint.path) {
        installed.push(breakpoint);
        continue;
      }
      const absolutePath = path.resolve(this.workspaceRoot, breakpoint.path);
      const relative = path.relative(this.workspaceRoot, absolutePath);
      if (relative.startsWith('..') || path.isAbsolute(relative)) {
        installed.push({ ...breakpoint, message: 'Breakpoint is outside the workspace' });
        continue;
      }
      try {
        const response = await this.inspector.request('Debugger.setBreakpointByUrl', {
          url: pathToFileURL(absolutePath).href,
          lineNumber: breakpoint.line - 1,
          condition: breakpoint.condition || undefined,
        });
        installed.push({
          ...breakpoint,
          verified: Boolean(response.breakpointId),
          inspectorId: response.breakpointId || null,
        });
      } catch (error) {
        installed.push({ ...breakpoint, verified: false, message: error?.message || String(error) });
      }
    }
    return installed;
  }

  fail(error) {
    this.appendOutput('stderr', `${error?.message || error}\n`);
    this.update({ status: 'failed', connected: false, error: error?.message || String(error) });
  }

  cleanupInspector() {
    this.inspector?.dispose();
    this.inspector = null;
    if (this.socket) {
      try { this.socket.close(); } catch {}
    }
    this.socket = null;
  }

  async stop() {
    this.cleanupInspector();
    if (this.child) {
      this.child.kill();
      this.child = null;
    }
    this.update({ status: 'idle', connected: false, callFrames: [], pauseReason: null, error: null });
  }
}
