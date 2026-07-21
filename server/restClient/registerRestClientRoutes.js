import { executeHttpRequest } from './executeHttpRequest.js';
import { parseHttpDocument } from './parseHttpDocument.js';
import { loadHttpRequestHistory, saveHttpRequestHistory } from '../db.js';

export function registerRestClientRoutes(app, getAuthorizationHeaderForUrl) {
  app.post('/api/rest-client/send', async (req, res) => {
    try {
      const requests = parseHttpDocument(req.body?.content);
      const request = requests[Number(req.body?.requestIndex || 0)];
      if (!request)
        return res.status(400).json({ error: 'HTTP request was not found' });
      const response = await executeHttpRequest(
        request,
        getAuthorizationHeaderForUrl,
      );
      const historyEntry = saveHttpRequestHistory(request, response);
      return res.json({ request, response, historyEntry });
    } catch (error) {
      const message =
        error?.name === 'AbortError'
          ? 'HTTP request timed out after 30 seconds'
          : error?.message;
      return res.status(400).json({ error: message || 'HTTP request failed' });
    }
  });

  app.get('/api/rest-client/history', (_req, res) => {
    res.json({ history: loadHttpRequestHistory() });
  });
}
