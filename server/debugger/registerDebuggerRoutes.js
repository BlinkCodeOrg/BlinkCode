import { NodeDebugSession } from './NodeDebugSession.js';
import { createDefaultLaunchConfiguration } from './createDefaultLaunchConfiguration.js';
import { loadDebugConfigurations } from './loadDebugConfigurations.js';
import { resolveDebugConfiguration } from './resolveDebugConfiguration.js';

export function registerDebuggerRoutes(app, getWorkspace) {
  let session = null;
  const getSession = () => {
    const workspace = getWorkspace();
    if (!session || session.workspaceRoot !== workspace) session = new NodeDebugSession(workspace);
    return session;
  };

  app.get('/api/debug/status', (_req, res) => {
    res.json(getSession().snapshot());
  });

  app.get('/api/debug/configurations', async (_req, res) => {
    try {
      res.json(await loadDebugConfigurations(getWorkspace()));
    } catch (error) {
      res.status(400).json({ error: error?.message || 'Unable to load debug configurations' });
    }
  });

  app.post('/api/debug/configurations', async (req, res) => {
    try {
      const configurations = await createDefaultLaunchConfiguration(
        getWorkspace(),
        String(req.body?.activeFile || ''),
      );
      res.status(201).json({ exists: true, path: '.blinkcode/launch.json', configurations });
    } catch (error) {
      res.status(400).json({ error: error?.message || 'Unable to create BlinkCode debug configuration' });
    }
  });

  app.post('/api/debug/start', async (req, res) => {
    try {
      const activeFile = String(req.body?.filePath || '');
      const configuration = resolveDebugConfiguration(
        req.body?.configuration || { program: activeFile },
        getWorkspace(),
        activeFile,
      );
      res.json(await getSession().startConfiguration(configuration, req.body?.breakpoints || []));
    } catch (error) {
      res.status(400).json({ error: error?.message || 'Debugger start failed' });
    }
  });

  app.post('/api/debug/attach', async (req, res) => {
    try {
      res.json(await getSession().attach(
        String(req.body?.endpoint || ''),
        req.body?.breakpoints || [],
      ));
    } catch (error) {
      res.json({
        ...getSession().snapshot(),
        error: error?.message || 'Debugger attach failed',
      });
    }
  });

  app.post('/api/debug/command', async (req, res) => {
    try {
      const command = String(req.body?.command || '');
      res.json(command === 'restart' ? await getSession().restart() : await getSession().command(command));
    } catch (error) {
      res.status(409).json({ error: error?.message || 'Debugger command failed' });
    }
  });

  app.get('/api/debug/variables', async (req, res) => {
    try {
      res.json({ variables: await getSession().variables(String(req.query.objectId || '')) });
    } catch (error) {
      res.status(409).json({ error: error?.message || 'Variable loading failed' });
    }
  });

  app.post('/api/debug/evaluate', async (req, res) => {
    try {
      res.json({
        result: await getSession().evaluate(
          String(req.body?.expression || ''),
          String(req.body?.callFrameId || ''),
        ),
      });
    } catch (error) {
      res.status(409).json({ error: error?.message || 'Expression evaluation failed' });
    }
  });

  app.delete('/api/debug/output', (_req, res) => {
    res.json(getSession().clearOutput());
  });
}
