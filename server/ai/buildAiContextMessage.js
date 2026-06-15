export function buildAiContextMessage(context = {}) {
  const sections = [];
  if (context.activeFile?.path) {
    sections.push(`Active file: ${context.activeFile.path}\n\`\`\`${context.activeFile.language || ''}\n${String(context.activeFile.content || '').slice(0, 24_000)}\n\`\`\``);
  }
  if (context.selection) sections.push(`Selected code:\n\`\`\`\n${String(context.selection).slice(0, 12_000)}\n\`\`\``);
  if (Array.isArray(context.openFiles) && context.openFiles.length) {
    sections.push(`Open files:\n${context.openFiles.slice(0, 20).join('\n')}`);
  }
  if (Array.isArray(context.workspaceFiles) && context.workspaceFiles.length) {
    sections.push(`Workspace tree:\n${context.workspaceFiles.slice(0, 200).join('\n')}`);
  }
  if (Array.isArray(context.searchResults) && context.searchResults.length) {
    sections.push(`Workspace search context:\n${context.searchResults.slice(0, 30).join('\n')}`);
  }
  return sections.join('\n\n');
}
