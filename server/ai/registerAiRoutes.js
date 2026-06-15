import { buildAiContextMessage } from './buildAiContextMessage.js';
import { executeAgentTool } from './executeAgentTool.js';
import { parseAgentPlan } from './parseAgentPlan.js';
import { requestAiCompletion } from './requestAiCompletion.js';
import { checkAiProvider } from './checkAiProvider.js';
import { consumeAiToolApproval, createAiToolApproval } from './aiToolApprovals.js';

export function registerAiRoutes(app, getWorkspace) {
  app.post('/api/ai/status', async (req, res) => {
    res.json(await checkAiProvider(req.body?.config));
  });

  app.post('/api/ai/complete', async (req, res) => {
    try {
      const { prefix = '', suffix = '', filePath = '', language = '' } = req.body || {};
      const result = await requestAiCompletion(req.body?.config, [
        { role: 'system', content: 'Complete the code at <CURSOR>. Return only the inserted text, without markdown fences or explanation.' },
        { role: 'user', content: `File: ${filePath}\nLanguage: ${language}\n${String(prefix).slice(-12_000)}<CURSOR>${String(suffix).slice(0, 4_000)}` },
      ], { maxTokens: 240, temperature: 0.1, timeoutMs: 30_000 });
      res.json({ completion: result.content, model: result.model });
    } catch (error) {
      res.status(502).json({ error: error?.name === 'AbortError' ? 'AI completion timed out' : error?.message });
    }
  });

  app.post('/api/ai/chat', async (req, res) => {
    try {
      const context = buildAiContextMessage(req.body?.context);
      const messages = [
        { role: 'system', content: 'You are BlinkCode coding assistant. Be concise, cite file paths when relevant, and do not claim edits were made.' },
        ...(context ? [{ role: 'system', content: context }] : []),
        ...(Array.isArray(req.body?.messages) ? req.body.messages.slice(-20) : []),
      ];
      res.json(await requestAiCompletion(req.body?.config, messages));
    } catch (error) {
      res.status(502).json({ error: error?.name === 'AbortError' ? 'AI chat timed out' : error?.message });
    }
  });

  app.post('/api/ai/agent/plan', async (req, res) => {
    try {
      const context = buildAiContextMessage(req.body?.context);
      const result = await requestAiCompletion(req.body?.config, [
        {
          role: 'system',
          content: 'Plan a coding task using JSON only: {"tools":[{"id":"1","name":"read_file|search|write_file|replace_in_file|run_command","arguments":{}}]}. Prefer reads/search first. Commands are limited to npm test, npm run <script>, git status and git diff.',
        },
        { role: 'user', content: `${req.body?.prompt || ''}\n\n${context}` },
      ], { maxTokens: 1200, temperature: 0.1 });
      res.json({ tools: parseAgentPlan(result.content), model: result.model });
    } catch (error) {
      res.status(502).json({ error: error?.message || 'AI agent planning failed' });
    }
  });

  app.post('/api/ai/tools/execute', async (req, res) => {
    try {
      const mutating = ['write_file', 'replace_in_file', 'run_command'].includes(req.body?.tool?.name);
      const approved = !mutating || consumeAiToolApproval(req.body?.approvalToken, req.body?.tool);
      res.json({ result: await executeAgentTool(getWorkspace(), req.body?.tool, approved) });
    } catch (error) {
      const status = error?.message?.includes('Confirmation is required') ? 409 : 400;
      res.status(status).json({ error: error?.message || 'AI tool failed' });
    }
  });

  app.post('/api/ai/tools/preview', (req, res) => {
    const tool = req.body?.tool;
    if (!['write_file', 'replace_in_file', 'run_command'].includes(tool?.name)) {
      return res.status(400).json({ error: 'This tool does not require approval' });
    }
    res.json({ approvalToken: createAiToolApproval(tool), tool });
  });
}
