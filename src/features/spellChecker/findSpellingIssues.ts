export const COMMON_WORDS = new Set([
  'a','about','add','after','all','also','an','and','api','app','are','as','at','be','before','blinkcode','build','by',
  'can','change','check','code','component','config','create','data','default','delete','description','do','editor','error',
  'file','files','for','from','function','get','has','have','if','in','is','it','language','line','list','local','mode','new',
  'no','not','of','on','open','or','path','project','return','run','save','search','server','set','settings','should','state',
  'string','support','test','tests','text','that','the','this','to','true','type','update','use','user','value','when','with',
  'workspace','you','your',
]);

function editDistance(left: string, right: string) {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const old = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (left[i - 1] === right[j - 1] ? 0 : 1));
      previous = old;
    }
  }
  return row[right.length];
}

export function findSpellingSuggestions(word: string): string[] {
  const normalized = word.toLowerCase();
  return [...COMMON_WORDS]
    .map(candidate => ({ candidate, distance: editDistance(normalized, candidate) }))
    .filter(item => item.distance <= 2)
    .sort((left, right) => left.distance - right.distance || left.candidate.localeCompare(right.candidate))
    .slice(0, 3)
    .map(item => item.candidate);
}

function commentOnlySource(source: string) {
  let inBlock = false;
  return source.split(/\r?\n/).map(line => {
    const blockStart = line.indexOf('/*');
    const blockEnd = line.indexOf('*/');
    if (inBlock) {
      if (blockEnd >= 0) inBlock = false;
      return line.slice(0, blockEnd >= 0 ? blockEnd : line.length);
    }
    if (blockStart >= 0) {
      inBlock = blockEnd < blockStart;
      return line.slice(blockStart + 2, blockEnd >= 0 ? blockEnd : line.length);
    }
    const lineComment = line.indexOf('//');
    const hashComment = line.indexOf('#');
    const commentStart = lineComment >= 0 ? lineComment + 2 : hashComment >= 0 ? hashComment + 1 : line.length;
    return `${' '.repeat(commentStart)}${line.slice(commentStart)}`;
  }).join('\n');
}

export function findSpellingIssues(source: string, commentsOnly = false) {
  const issues: Array<{ word: string; line: number; startColumn: number; endColumn: number }> = [];
  const searchable = commentsOnly ? commentOnlySource(source) : source;
  searchable.split(/\r?\n/).forEach((line, lineIndex) => {
    const text = line.replace(/`[^`]*`/g, ' ');
    for (const match of text.matchAll(/[A-Za-z][A-Za-z'-]{3,}/g)) {
      const word = match[0];
      if (COMMON_WORDS.has(word.toLowerCase()) || /[A-Z].*[A-Z]|[a-z][A-Z]|_/.test(word)) continue;
      issues.push({
        word,
        line: lineIndex + 1,
        startColumn: (match.index || 0) + 1,
        endColumn: (match.index || 0) + word.length + 1,
      });
    }
  });
  return issues;
}
