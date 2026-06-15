import type { UserSnippet } from '../../types';
import type { SnippetDraft } from './snippetDraftTypes';

export function createSnippetDraft(snippet: UserSnippet): SnippetDraft {
  return {
    name: snippet.name,
    prefix: snippet.prefix,
    languages: snippet.languages.join(','),
    body: snippet.body,
    description: snippet.description || '',
  };
}
