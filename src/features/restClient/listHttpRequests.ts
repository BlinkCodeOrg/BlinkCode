export interface HttpRequestSummary {
  index: number;
  method: string;
  url: string;
}

export function listHttpRequests(content: string): HttpRequestSummary[] {
  return String(content || '').split(/^\s*###.*$/m).flatMap((block, index) => {
    for (const line of block.split(/\r?\n/)) {
      const match = line.trim().match(/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+(\S+)/i);
      if (match) return [{ index, method: match[1].toUpperCase(), url: match[2] }];
      if (line.trim() && !line.trim().startsWith('#') && !line.trim().startsWith('@')) break;
    }
    return [];
  });
}
