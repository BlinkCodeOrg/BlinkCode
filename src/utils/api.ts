export { attachDebugSession, clearDebugOutput, createDebugConfiguration, evaluateDebugExpression, fetchDebugConfigurations, fetchDebugStatus, fetchDebugVariables, sendDebugCommand, startDebugSession } from '../features/apiClient/debuggerApi';
export { executeAiTool, fetchAiProviderStatus, requestAiAgentPlan, requestAiChat, requestAiCompletion, requestAiToolApproval } from '../features/apiClient/aiApi';
export {
  createFileOnServer,
  deleteOnServer,
  fetchFileContent,
  fetchFileCursorPosition,
  fetchLargeFilePreview,
  moveOnServer,
  renameOnServer,
  saveFile,
  saveFileCursorPosition,
  trashOnServer,
} from '../features/apiClient/fileApi';
export {
  addWorkspaceRoot,
  closeWorkspace,
  deleteRecoveryBuffer,
  fetchRecentProjects,
  fetchRecoveryBuffers,
  fetchSettings,
  fetchSettingsRaw,
  fetchState,
  fetchTree,
  openFolderOnServer,
  saveRecoveryBuffer,
  saveSettingsRaw,
  saveSettingsToServer,
  saveStateToServer,
  uploadFolder,
} from '../features/apiClient/workspaceApi';
export { fetchDependencies } from '../features/apiClient/fetchDependencies';
export { fetchEditorConfig } from '../features/apiClient/fetchEditorConfig';
export { fetchExtensions } from '../features/apiClient/fetchExtensions';
export { clearEditorConfigCache, fetchEditorConfigCached } from '../features/apiClient/editorConfigCache';
export type { EditorConfigProperties } from '../features/apiClient/fetchEditorConfig';
export { fetchOutdatedDependencies } from '../features/apiClient/fetchOutdatedDependencies';
export { fetchGitBlameLine, fetchGitFileDiff, fetchGitInlineDiff, fetchGitStatus, gitCommit, gitDiscard, gitPull, gitPush, gitResolveConflict, gitStage, gitUnstage } from '../features/apiClient/gitApi';
export { fetchNpmScripts } from '../features/apiClient/fetchNpmScripts';
export { fetchRestClientHistory } from '../features/apiClient/fetchRestClientHistory';
export { fetchWebWorkflow } from '../features/apiClient/fetchWebWorkflow';
export { getFileSystemWsUrl as getFsWsUrl } from '../features/apiClient/getFileSystemWsUrl';
export { getRawFileUrl } from '../features/apiClient/getRawFileUrl';
export { getTerminalWsUrl as getWsUrl } from '../features/apiClient/getTerminalWsUrl';
export { isImageFile } from '../features/apiClient/isImageFile';
export { replaceWorkspace } from '../features/apiClient/replaceWorkspace';
export { replaceWorkspaceMatch } from '../features/apiClient/replaceWorkspaceMatch';
export { sendRestClientRequest } from '../features/apiClient/sendRestClientRequest';
export { searchWorkspace } from '../features/apiClient/searchWorkspace';
export { searchWorkspaceStream } from '../features/apiClient/searchWorkspaceStream';
export { updateExtension } from '../features/apiClient/updateExtension';

export type {
  GitBlameLineInfo,
  GitBlameLineResponse,
  GitFileDiffResponse,
  GitFileEntry,
  GitInlineDiffHunk,
  GitInlineDiffResponse,
  GitStatusResponse,
} from '../features/apiClient/gitTypes';
export type { SettingsResponse } from '../features/apiClient/settingsTypes';
export type {
  DependencyPackage,
  DependencyType,
  OutdatedDependenciesResponse,
  OutdatedDependency,
  PackageManager,
  ProjectDependency,
} from '../features/apiClient/dependencyTypes';
export type {
  DebugCallFrame,
  DebugBreakpoint,
  DebugConfiguration,
  DebugConfigurationsResponse,
  DebugOutputLine,
  DebugScope,
  DebugSessionState,
  DebugStatus,
  DebugVariable,
} from '../features/apiClient/debuggerTypes';
export type { DebugCommand } from '../features/apiClient/debuggerApi';
export type { AiContext, AiMessage, AiToolCall } from '../features/apiClient/aiTypes';
export type { AiProviderStatus } from '../features/apiClient/aiApi';
export type { NpmScriptItem, NpmScriptPackage } from '../features/apiClient/npmScriptTypes';
export type { RestClientHistoryEntry, RestClientRequest, RestClientResponse } from '../features/apiClient/restClientTypes';
export type {
  WebWorkflowAnalysis,
  WebWorkflowDevServerScript,
  WebWorkflowFlags,
  WebWorkflowPackage,
} from '../features/apiClient/webWorkflowTypes';
export type {
  WorkspaceSearchFileResult,
  WorkspaceSearchMatch,
  WorkspaceSearchOptions,
  WorkspaceSearchResponse,
} from '../features/apiClient/workspaceSearchTypes';
