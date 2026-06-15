const order = ['position', 'display', 'flex', 'grid', 'overflow', 'width', 'height', 'margin', 'padding', 'gap', 'border', 'background', 'font', 'text', 'effect'];

function rank(value: string) {
  const className = value.split(':').at(-1) || value;
  if (/^(absolute|relative|fixed|sticky)/.test(className)) return 0;
  if (/^(hidden|block|inline|flex|grid|contents)/.test(className)) return 1;
  if (/^(items|justify)/.test(className)) return 2;
  if (/^overflow/.test(className)) return 4;
  if (/^(w|min-w|max-w)/.test(className)) return 5;
  if (/^(h|min-h|max-h)/.test(className)) return 6;
  if (/^(m|mx|my|mt|mr|mb|ml)-/.test(className)) return 7;
  if (/^(p|px|py|pt|pr|pb|pl)-/.test(className)) return 8;
  if (/^gap-/.test(className)) return 9;
  if (/^(border|rounded)/.test(className)) return 10;
  if (/^bg-/.test(className)) return 11;
  if (/^font-/.test(className)) return 12;
  if (/^text-/.test(className)) return 13;
  if (/^(shadow|opacity|transition|duration)/.test(className)) return 14;
  return order.length;
}

export function sortTailwindClasses(value: string): string {
  return value.trim().split(/\s+/).sort((a, b) => rank(a) - rank(b) || a.localeCompare(b)).join(' ');
}
