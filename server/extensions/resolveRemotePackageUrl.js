export function resolveRemotePackageUrl(registryUrl, directory, fileName) {
  if (
    typeof directory !== 'string'
    || !/^[a-z0-9][a-z0-9-]{1,79}$/i.test(directory)
    || typeof fileName !== 'string'
    || fileName.includes('/')
    || fileName.includes('\\')
    || fileName.startsWith('.')
  ) {
    throw new Error('Invalid remote extension package path');
  }

  return new URL(`${directory}/${fileName}`, registryUrl).toString();
}
