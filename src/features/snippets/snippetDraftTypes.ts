export interface SnippetDraft {
  name: string;
  prefix: string;
  languages: string;
  body: string;
  description: string;
}

export type SnippetDraftError =
  | 'nameRequired'
  | 'prefixRequired'
  | 'languagesRequired'
  | 'bodyRequired'
  | 'duplicatePrefix';
