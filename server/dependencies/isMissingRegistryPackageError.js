export function isMissingRegistryPackageError(message) {
  return /\bE404\b|404 Not Found|is not in this registry/i.test(String(message || ''));
}
