function normalizeEntry(name, value) {
  if (!value || typeof value !== 'object') return null;
  const current = value.current || value.version || null;
  const wanted = value.wanted || value.range || null;
  const latest = value.latest || value.latestVersion || null;
  if (!current && !wanted && !latest) return null;
  return { name, current, wanted, latest };
}

export function parseOutdatedOutput(output) {
  const trimmed = String(output || '').trim();
  if (!trimmed) return [];

  const candidates = [trimmed, ...trimmed.split(/\r?\n/).reverse()];
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) {
        return parsed
          .map(item => normalizeEntry(item?.name || item?.package || '', item))
          .filter(Boolean);
      }
      if (parsed?.type === 'table' && Array.isArray(parsed?.data?.body)) {
        return parsed.data.body.map(row => ({
          name: row[0],
          current: row[1] || null,
          wanted: row[2] || null,
          latest: row[3] || null,
        }));
      }
      if (parsed && typeof parsed === 'object') {
        return Object.entries(parsed)
          .map(([name, value]) => normalizeEntry(name, value))
          .filter(Boolean);
      }
    } catch {}
  }
  return [];
}
