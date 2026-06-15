import { en } from '../features/i18n/en';
import { ru } from '../features/i18n/ru';

const dicts: Record<string, Record<string, string>> = { en, ru };

export function t(key: string, lang: string, args?: Record<string, string | number>): string {
  const dict = dicts[lang] || dicts.en;
  let val = dict[key] || dicts.en[key] || key;
  if (args) {
    Object.entries(args).forEach(([k, v]) => {
      val = val.replace(`{${k}}`, String(v));
    });
  }
  return val;
}
