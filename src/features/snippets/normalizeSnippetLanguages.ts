export function normalizeSnippetLanguages(value: string): string[] {
  return [...new Set(
    value
      .split(',')
      .map(language => language.trim().toLowerCase())
      .filter(Boolean),
  )];
}
