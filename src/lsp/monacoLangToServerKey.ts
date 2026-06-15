import type { ServerKey } from './sessionTypes';

export const MONACO_LANG_TO_SERVER_KEY: Record<string, ServerKey> = {
  typescript: 'typescript',
  javascript: 'typescript',
  typescriptreact: 'typescript',
  javascriptreact: 'typescript',
  html: 'html',
  css: 'css',
  scss: 'css',
  less: 'css',
  json: 'json',
  jsonc: 'json',
};
