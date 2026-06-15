export const AI_QUICK_ACTIONS = [
  { id: 'explain', labelKey: 'ai.action.explain', promptKey: 'ai.prompt.explain' },
  { id: 'refactor', labelKey: 'ai.action.refactor', promptKey: 'ai.prompt.refactor' },
  { id: 'fix', labelKey: 'ai.action.fix', promptKey: 'ai.prompt.fix' },
  { id: 'document', labelKey: 'ai.action.document', promptKey: 'ai.prompt.document' },
  { id: 'tests', labelKey: 'ai.action.tests', promptKey: 'ai.prompt.tests' },
  { id: 'optimize', labelKey: 'ai.action.optimize', promptKey: 'ai.prompt.optimize' },
] as const;

export type AiQuickActionId = typeof AI_QUICK_ACTIONS[number]['id'];
