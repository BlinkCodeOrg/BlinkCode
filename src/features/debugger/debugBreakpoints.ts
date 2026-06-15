import type { DebugBreakpoint } from '../apiClient/debuggerTypes';

const STORAGE_KEY = 'blinkcode-debug-breakpoints';

type StoredBreakpoint = number | Pick<DebugBreakpoint, 'id' | 'line' | 'enabled' | 'condition'>;
type BreakpointMap = Record<string, StoredBreakpoint[]>;

function loadBreakpointMap(): BreakpointMap {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function getDebugBreakpoints(filePath: string): number[] {
  return getAllDebugBreakpoints()
    .filter(breakpoint => breakpoint.path === filePath && breakpoint.enabled)
    .map(breakpoint => breakpoint.line);
}

export function getAllDebugBreakpoints(): DebugBreakpoint[] {
  return Object.entries(loadBreakpointMap()).flatMap(([filePath, breakpoints]) => (
    breakpoints.map((breakpoint, index) => {
      const source = typeof breakpoint === 'number'
        ? { line: breakpoint, enabled: true, condition: '' }
        : breakpoint;
      return {
        id: ('id' in source && source.id) || `${filePath}:${source.line}:${index}`,
        path: filePath,
        line: source.line,
        enabled: source.enabled !== false,
        condition: source.condition || '',
      };
    })
  ));
}

export function toggleDebugBreakpoint(filePath: string, line: number): number[] {
  const map = loadBreakpointMap();
  const current = [...(map[filePath] || [])];
  const existingIndex = current.findIndex(item => (typeof item === 'number' ? item : item.line) === line);
  if (existingIndex >= 0) current.splice(existingIndex, 1);
  else current.push({ id: `${filePath}:${line}`, line, enabled: true, condition: '' });
  const next = current.sort((left, right) => (
    (typeof left === 'number' ? left : left.line) - (typeof right === 'number' ? right : right.line)
  ));
  map[filePath] = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  const lines = getDebugBreakpoints(filePath);
  window.dispatchEvent(new CustomEvent('blinkcode:debugBreakpointsChanged', {
    detail: { filePath, breakpoints: lines },
  }));
  return lines;
}

export function setDebugBreakpointEnabled(id: string, enabled: boolean) {
  updateStoredBreakpoint(id, breakpoint => ({ ...breakpoint, enabled }));
}

export function setDebugBreakpointCondition(id: string, condition: string) {
  updateStoredBreakpoint(id, breakpoint => ({ ...breakpoint, condition }));
}

export function removeDebugBreakpoint(id: string) {
  const map = loadBreakpointMap();
  for (const [filePath, items] of Object.entries(map)) {
    map[filePath] = items.filter((item, index) => {
      const sourceId = typeof item === 'number' ? `${filePath}:${item}:${index}` : item.id;
      return sourceId !== id && `${filePath}:${typeof item === 'number' ? item : item.line}` !== id;
    });
    if (!map[filePath].length) delete map[filePath];
  }
  persistBreakpointMap(map);
}

function updateStoredBreakpoint(id: string, update: (breakpoint: Exclude<StoredBreakpoint, number>) => Exclude<StoredBreakpoint, number>) {
  const map = loadBreakpointMap();
  for (const [filePath, items] of Object.entries(map)) {
    map[filePath] = items.map((item, index) => {
      const breakpoint = typeof item === 'number'
        ? { id: `${filePath}:${item}:${index}`, line: item, enabled: true, condition: '' }
        : item;
      return breakpoint.id === id || `${filePath}:${breakpoint.line}` === id ? update(breakpoint) : breakpoint;
    });
  }
  persistBreakpointMap(map);
}

function persistBreakpointMap(map: BreakpointMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  window.dispatchEvent(new CustomEvent('blinkcode:debugBreakpointsChanged'));
}
