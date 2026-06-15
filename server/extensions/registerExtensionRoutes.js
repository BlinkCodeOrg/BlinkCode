export function registerExtensionRoutes(app, service) {
  app.get('/api/extensions', async (req, res) => {
    try {
      res.json(await service.list(req.query.refresh === '1'));
    } catch (error) {
      res.status(500).json({ error: error?.message || 'Could not load extensions' });
    }
  });

  for (const operation of ['install', 'uninstall', 'enable', 'disable']) {
    app.post(`/api/extensions/:id/${operation}`, async (req, res) => {
      try {
        res.json(await service[operation](req.params.id));
      } catch (error) {
        const status = error?.message === 'Extension not found' ? 404 : 400;
        res.status(status).json({ error: error?.message || 'Extension operation failed' });
      }
    });
  }
}
