function substituteVariables(value, variables) {
  return value.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_match, name) => {
    if (!(name in variables)) throw new Error(`Unknown HTTP variable: ${name}`);
    return variables[name];
  });
}

export function parseHttpDocument(content) {
  const variables = {};
  const lines = String(content || '').replace(/\r\n/g, '\n').split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*@([\w.-]+)\s*=\s*(.*?)\s*$/);
    if (match) variables[match[1]] = match[2];
  }

  return lines.join('\n').split(/^\s*###.*$/m).flatMap((block, index) => {
    const blockLines = block.split('\n');
    let requestLineIndex = -1;
    let requestLineMatch = null;
    for (let lineIndex = 0; lineIndex < blockLines.length; lineIndex += 1) {
      const line = blockLines[lineIndex].trim();
      if (!line || line.startsWith('#') || line.startsWith('@')) continue;
      requestLineMatch = line.match(/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+(\S+?)(?:\s+HTTP\/\d(?:\.\d)?)?$/i);
      if (requestLineMatch) requestLineIndex = lineIndex;
      break;
    }
    if (!requestLineMatch) return [];

    const headers = {};
    let cursor = requestLineIndex + 1;
    for (; cursor < blockLines.length; cursor += 1) {
      const line = blockLines[cursor];
      if (!line.trim()) {
        cursor += 1;
        break;
      }
      const separator = line.indexOf(':');
      if (separator < 1) throw new Error(`Invalid header in request ${index + 1}: ${line}`);
      headers[line.slice(0, separator).trim()] = substituteVariables(line.slice(separator + 1).trim(), variables);
    }

    const method = requestLineMatch[1].toUpperCase();
    const url = substituteVariables(requestLineMatch[2], variables);
    const body = substituteVariables(blockLines.slice(cursor).join('\n').trim(), variables);
    return [{
      index,
      name: `${method} ${url}`,
      method,
      url,
      headers,
      body: body || null,
    }];
  });
}
