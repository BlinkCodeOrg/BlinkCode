import { MONACO_LANG_TO_LSP_LANG } from './monacoLangToLspLang';
import type { MonacoModel } from './sessionTypes';

export function getLspLanguageForModel(model: MonacoModel, monacoLang: string): string {
  try {
    const path = String(model?.uri?.path || '').toLowerCase();
    if (path.endsWith('.tsx')) return 'typescriptreact';
    if (path.endsWith('.jsx')) return 'javascriptreact';
  } catch {}

  return MONACO_LANG_TO_LSP_LANG[monacoLang] || monacoLang;
}
