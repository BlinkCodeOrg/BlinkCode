import type { ServerKey } from './sessionTypes';

export const SERVER_KEY_TO_LANGS: Record<ServerKey, string[]> = {
  typescript: ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'],
  html: ['html'],
  css: ['css', 'scss', 'less'],
  json: ['json', 'jsonc'],
};
