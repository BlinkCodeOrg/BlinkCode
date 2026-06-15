import type { SnippetDraft } from './snippetDraftTypes';

export function createEmptySnippetDraft(): SnippetDraft {
  return {
    name: '',
    prefix: '',
    languages: 'javascript,typescript',
    body: '',
    description: '',
  };
}
