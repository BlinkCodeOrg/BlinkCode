import type { FileGroup } from './problemTypes';

export function limitProblemGroups(groups: FileGroup[], limit: number): FileGroup[] {
  let remaining = Math.max(0, limit);
  const visible: FileGroup[] = [];

  for (const group of groups) {
    if (remaining <= 0) break;
    const items = group.items.slice(0, remaining);
    if (items.length === 0) continue;
    visible.push({ ...group, items });
    remaining -= items.length;
  }
  return visible;
}
