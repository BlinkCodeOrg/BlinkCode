const ID_PATTERN = /^[a-z0-9][a-z0-9.-]{2,79}$/;
const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/i;
const ALLOWED_PERMISSIONS = new Set([
  'commands',
  'feature:markdown-preview',
  'feature:spell-checker',
  'feature:theme-import',
]);
const RESOURCE_KEYS = new Set(['repository', 'issues', 'license', 'marketplace', 'publisher']);

function optionalDate(value, key) {
  if (value === undefined) return null;
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new Error(`Extension ${key} must be an ISO date`);
  }
  return value;
}

function normalizeResources(value) {
  if (value === undefined) return {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Extension resources must be an object');
  }
  const resources = {};
  for (const [key, url] of Object.entries(value)) {
    if (!RESOURCE_KEYS.has(key)) throw new Error(`Unsupported extension resource: ${key}`);
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
      throw new Error(`Extension resource ${key} must be an HTTP(S) URL`);
    }
    resources[key] = url;
  }
  return resources;
}

export function validateExtensionManifest(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Extension manifest must be an object');
  }
  if (value.schemaVersion !== 1) throw new Error('Unsupported extension manifest version');
  if (!ID_PATTERN.test(value.id || '')) throw new Error('Invalid extension id');
  if (!VERSION_PATTERN.test(value.version || '')) throw new Error('Invalid extension version');
  for (const key of ['name', 'displayName', 'publisher', 'description', 'main', 'readme', 'icon']) {
    if (typeof value[key] !== 'string' || !value[key].trim()) {
      throw new Error(`Extension manifest is missing ${key}`);
    }
  }
  for (const key of ['main', 'readme', 'icon']) {
    if (value[key].includes('/') || value[key].includes('\\') || value[key].startsWith('.')) {
      throw new Error(`Extension ${key} must be a file in the extension root`);
    }
  }
  if (!/\.md$/i.test(value.readme)) throw new Error('Extension readme must be Markdown');
  if (!/\.(png|jpe?g|webp|svg)$/i.test(value.icon)) throw new Error('Unsupported extension icon format');
  if (value.license !== undefined && (typeof value.license !== 'string' || !value.license.trim())) {
    throw new Error('Extension license must be a non-empty string');
  }
  const permissions = Array.isArray(value.permissions) ? value.permissions : [];
  if (permissions.some(permission => !ALLOWED_PERMISSIONS.has(permission))) {
    throw new Error('Extension requests an unsupported permission');
  }
  return {
    ...value,
    categories: Array.isArray(value.categories) ? value.categories.slice(0, 8) : [],
    permissions: [...new Set(permissions)],
    license: value.license?.trim() || null,
    publishedAt: optionalDate(value.publishedAt, 'publishedAt'),
    lastUpdatedAt: optionalDate(value.lastUpdatedAt, 'lastUpdatedAt'),
    lastReleasedAt: optionalDate(value.lastReleasedAt, 'lastReleasedAt'),
    resources: normalizeResources(value.resources),
  };
}
