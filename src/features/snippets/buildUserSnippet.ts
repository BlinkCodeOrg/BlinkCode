import type { UserSnippet } from '../../types';
import { normalizeSnippetLanguages } from './normalizeSnippetLanguages';
import type { SnippetDraft } from './snippetDraftTypes';

export function buildUserSnippet(id: string, draft: SnippetDraft): UserSnippet {
  const description = draft.description.trim();
  return {
    id,
    name: draft.name.trim(),
    prefix: draft.prefix.trim(),
    languages: normalizeSnippetLanguages(draft.languages),
    body: draft.body,
    ...(description ? { description } : {}),
  };
}
