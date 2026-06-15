import { resolve } from 'node:path';
import { createServer as createViteServer } from 'vite';

export default async function globalSetup() {
  process.env.BLINKCODE_STORAGE_DIR = resolve('e2e/.storage');
  process.env.BLINKCODE_WORKSPACE = resolve('e2e/fixtures/workspace');
  process.env.PORT = '3311';
  process.env.VITE_BACKEND_PORT = '3311';
  process.env.VITE_PORT = '5178';

  const { startBlinkCodeServer, stopBlinkCodeServer } = await import('../../server/index.js');
  await startBlinkCodeServer();

  const viteServer = await createViteServer({
    server: {
      host: '127.0.0.1',
      port: 5178,
      strictPort: true,
    },
  });
  await viteServer.listen();

  return async () => {
    await viteServer.close();
    await stopBlinkCodeServer();
  };
}
