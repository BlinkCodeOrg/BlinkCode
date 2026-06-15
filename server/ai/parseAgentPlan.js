export function parseAgentPlan(content) {
  const fenced = String(content || '').match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] || content;
  let parsed;
  try { parsed = JSON.parse(fenced); } catch { throw new Error('AI agent returned an invalid JSON plan'); }
  const tools = Array.isArray(parsed) ? parsed : parsed.tools;
  if (!Array.isArray(tools)) throw new Error('AI agent plan does not contain tools');
  return tools.slice(0, 12).map((tool, index) => ({
    id: String(tool.id || `tool-${index + 1}`),
    name: String(tool.name || ''),
    arguments: tool.arguments && typeof tool.arguments === 'object' ? tool.arguments : {},
  }));
}
