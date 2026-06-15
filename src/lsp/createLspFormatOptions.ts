export function createLspFormatOptions(options: any) {
  return {
    tabSize: options?.tabSize ?? 2,
    insertSpaces: options?.insertSpaces ?? true,
    trimTrailingWhitespace: true,
    insertFinalNewline: true,
    trimFinalNewlines: true,
  };
}
