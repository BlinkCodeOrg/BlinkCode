import { EN } from '../features/landingI18n/enDict';
import { RU } from '../features/landingI18n/ruDict';

const DICTS: Record<string, typeof EN> = { en: EN, ru: RU };

export function getLandingDict(lang: string) {
  return DICTS[lang] || DICTS.en;
}