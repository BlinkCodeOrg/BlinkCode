function parseVersion(version) {
  const match = String(version || '').trim().match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/);
  if (!match) return null;
  return {
    numbers: match.slice(1, 4).map(Number),
    prerelease: match[4] || '',
  };
}

export function isNewerExtensionVersion(candidate, current) {
  const next = parseVersion(candidate);
  const installed = parseVersion(current);
  if (!next || !installed) return String(candidate) !== String(current);

  for (let index = 0; index < next.numbers.length; index += 1) {
    if (next.numbers[index] !== installed.numbers[index]) {
      return next.numbers[index] > installed.numbers[index];
    }
  }

  if (next.prerelease === installed.prerelease) return false;
  if (!next.prerelease) return true;
  if (!installed.prerelease) return false;
  return next.prerelease.localeCompare(installed.prerelease, undefined, { numeric: true }) > 0;
}
