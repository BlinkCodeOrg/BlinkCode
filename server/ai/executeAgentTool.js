import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { resolveWorkspacePath } from '../pathSafety.js';
import { searchWorkspace } from '../search.js';

const MAX_FILE_BYTES = 1024 * 1024;

export async function executeAgentTool(workspace, tool, confirmed = false) {
  const name = String(tool?.name || '');
  const args = tool?.arguments || {};
  if (name === 'search') return searchWorkspace(workspace, { query: String(args.query || ''), include: args.include || '' });
  if (name === 'read_file') {
    const target = requireWorkspaceFile(workspace, args.path);
    const stat = fs.statSync(target);
    if (stat.size > MAX_FILE_BYTES) throw new Error('File is too large for the AI agent');
    return { path: normalizePath(path.relative(workspace, target)), content: fs.readFileSync(target, 'utf8') };
  }
  if (name === 'write_file') {
    requireConfirmation(confirmed);
    const target = resolveWorkspacePath(workspace, String(args.path || ''));
    if (!target) throw new Error('Invalid file path');
    const content = String(args.content ?? '');
    if (Buffer.byteLength(content) > MAX_FILE_BYTES) throw new Error('File content is too large');
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content, 'utf8');
    return { path: normalizePath(path.relative(workspace, target)), bytes: Buffer.byteLength(content) };
  }
  if (name === 'replace_in_file') {
    requireConfirmation(confirmed);
    const target = requireWorkspaceFile(workspace, args.path);
    const content = fs.readFileSync(target, 'utf8');
    const search = String(args.search ?? '');
    if (!search || !content.includes(search)) throw new Error('Replacement target was not found');
    const updated = content.replace(search, String(args.replacement ?? ''));
    fs.writeFileSync(target, updated, 'utf8');
    return { path: normalizePath(path.relative(workspace, target)), replacements: 1 };
  }
  if (name === 'run_command') {
    requireConfirmation(confirmed);
    return runSafeCommand(workspace, String(args.command || ''));
  }
  throw new Error(`Unsupported AI tool: ${name}`);
}

function requireWorkspaceFile(workspace, requestedPath) {
  const target = resolveWorkspacePath(workspace, String(requestedPath || ''));
  if (!target || !fs.existsSync(target) || !fs.statSync(target).isFile()) throw new Error('File not found');
  return target;
}

function requireConfirmation(confirmed) {
  if (!confirmed) throw new Error('Confirmation is required for this tool');
}

function normalizePath(value) {
  return value.replace(/\\/g, '/');
}

function runSafeCommand(workspace, command) {
  const npmMatch = command.match(/^npm(?:\.cmd)?\s+(test|run\s+[\w:.-]+)$/);
  const gitMatch = command.match(/^git\s+(status|diff)(?:\s+--stat)?$/);
  if (!npmMatch && !gitMatch) throw new Error('Only npm test, npm run <script>, git status and git diff are allowed');
  const executable = npmMatch ? (process.platform === 'win32' ? 'npm.cmd' : 'npm') : 'git';
  const args = (npmMatch ? npmMatch[1] : gitMatch[0].slice(4)).split(/\s+/);
  return new Promise((resolve, reject) => {
    execFile(executable, args, { cwd: workspace, timeout: 120_000, maxBuffer: 2 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error && !stdout && !stderr) return reject(error);
      resolve({ command, stdout, stderr, exitCode: Number(error?.code || 0), timedOut: Boolean(error?.killed) });
    });
  });
}
