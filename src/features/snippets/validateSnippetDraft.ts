import type { UserSnippet } from '../../types';
import { normalizeSnippetLanguages } from './normalizeSnippetLanguages';
import type { SnippetDraft, SnippetDraftError } from './snippetDraftTypes';

export function validateSnippetDraft(
  draft: SnippetDraft,
  snippets: UserSnippet[],
  editingId: string | null,
): SnippetDraftError | null {
  if (!draft.name.trim()) return 'nameRequired';
  if (!draft.prefix.trim()) return 'prefixRequired';
  const languages = normalizeSnippetLanguages(draft.languages);
  if (!languages.length) return 'languagesRequired';
  if (!draft.body.trim()) return 'bodyRequired';

  const prefix = draft.prefix.trim().toLowerCase();
  const duplicate = snippets.some(snippet => (
    snippet.id !== editingId
    && snippet.prefix.trim().toLowerCase() === prefix
    && snippet.languages.some(language => languages.includes(language.toLowerCase()))
  ));
  return duplicate ? 'duplicatePrefix' : null;
}
