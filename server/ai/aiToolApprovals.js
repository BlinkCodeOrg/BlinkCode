import crypto from 'node:crypto';

const approvals = new Map();
const TTL_MS = 60_000;

export function createAiToolApproval(tool) {
  const token = crypto.randomBytes(24).toString('hex');
  approvals.set(token, { expires: Date.now() + TTL_MS, signature: JSON.stringify(tool) });
  return token;
}

export function consumeAiToolApproval(token, tool) {
  const approval = approvals.get(String(token || ''));
  approvals.delete(String(token || ''));
  return Boolean(approval && approval.expires > Date.now() && approval.signature === JSON.stringify(tool));
}
