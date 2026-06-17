export { attachDebugSession } from '../features/apiClient/attachDebugSession';
export { addWorkspaceRoot } from '../features/apiClient/addWorkspaceRoot';
export { executeAiTool } from '../features/apiClient/executeAiTool';
export { closeWorkspace } from '../features/apiClient/closeWorkspace';
export { clearDebugOutput } from '../features/apiClient/clearDebugOutput';
export { createFileOnServer } from '../features/apiClient/createFileOnServer';
export { deleteOnServer } from '../features/apiClient/deleteOnServer';
export { deleteRecoveryBuffer } from '../features/apiClient/deleteRecoveryBuffer';
export { fetchFileContent } from '../features/apiClient/fetchFileContent';
export { fetchDependencies } from '../features/apiClient/fetchDependencies';
export { fetchEditorConfig } from '../features/apiClient/fetchEditorConfig';
export { fetchExtensions } from '../features/apiClient/fetchExtensions';
export { clearEditorConfigCache, fetchEditorConfigCached } from '../features/apiClient/editorConfigCache';
export type { EditorConfigProperties } from '../features/apiClient/fetchEditorConfig';
export { fetchAiProviderStatus } from '../features/apiClient/fetchAiProviderStatus';
export { fetchDebugStatus } from '../features/apiClient/fetchDebugStatus';
export { fetchDebugConfigurations } from '../features/apiClient/fetchDebugConfigurations';
export { fetchDebugVariables } from '../features/apiClient/fetchDebugVariables';
export { createDebugConfiguration } from '../features/apiClient/createDebugConfiguration';
export { evaluateDebugExpression } from '../features/apiClient/evaluateDebugExpression';
export { fetchOutdatedDependencies } from '../features/apiClient/fetchOutdatedDependencies';
export { fetchLargeFilePreview } from '../features/apiClient/fetchLargeFilePreview';
export { fetchGitBlameLine } from '../features/apiClient/fetchGitBlameLine';
export { fetchGitFileDiff } from '../features/apiClient/fetchGitFileDiff';
export { fetchGitInlineDiff } from '../features/apiClient/fetchGitInlineDiff';
export { fetchFileCursorPosition } from '../features/apiClient/fetchFileCursorPosition';
export { fetchGitStatus } from '../features/apiClient/fetchGitStatus';
export { fetchNpmScripts } from '../features/apiClient/fetchNpmScripts';
export { fetchRecentProjects } from '../features/apiClient/fetchRecentProjects';
export { fetchRecoveryBuffers } from '../features/apiClient/fetchRecoveryBuffers';
export { fetchRestClientHistory } from '../features/apiClient/fetchRestClientHistory';
export { fetchSettings } from '../features/apiClient/fetchSettings';
export { fetchSettingsRaw } from '../features/apiClient/fetchSettingsRaw';
export { fetchState } from '../features/apiClient/fetchState';
export { fetchTree } from '../features/apiClient/fetchTree';
export { fetchWebWorkflow } from '../features/apiClient/fetchWebWorkflow';
export { getFileSystemWsUrl as getFsWsUrl } from '../features/apiClient/getFileSystemWsUrl';
export { getRawFileUrl } from '../features/apiClient/getRawFileUrl';
export { getTerminalWsUrl as getWsUrl } from '../features/apiClient/getTerminalWsUrl';
export { gitCommit } from '../features/apiClient/gitCommit';
export { gitResolveConflict } from '../features/apiClient/gitResolveConflict';
export { gitDiscard } from '../features/apiClient/gitDiscard';
export { gitPull } from '../features/apiClient/gitPull';
export { gitPush } from '../features/apiClient/gitPush';
export { gitStage } from '../features/apiClient/gitStage';
export { gitUnstage } from '../features/apiClient/gitUnstage';
export { isImageFile } from '../features/apiClient/isImageFile';
export { moveOnServer } from '../features/apiClient/moveOnServer';
export { openFolderOnServer } from '../features/apiClient/openFolderOnServer';
export { renameOnServer } from '../features/apiClient/renameOnServer';
export { requestAiAgentPlan } from '../features/apiClient/requestAiAgentPlan';
export { requestAiToolApproval } from '../features/apiClient/requestAiToolApproval';
export { requestAiChat } from '../features/apiClient/requestAiChat';
export { requestAiCompletion } from '../features/apiClient/requestAiCompletion';
export { replaceWorkspace } from '../features/apiClient/replaceWorkspace';
export { replaceWorkspaceMatch } from '../features/apiClient/replaceWorkspaceMatch';
export { saveFile } from '../features/apiClient/saveFile';
export { saveRecoveryBuffer } from '../features/apiClient/saveRecoveryBuffer';
export { saveFileCursorPosition } from '../features/apiClient/saveFileCursorPosition';
export { saveSettingsRaw } from '../features/apiClient/saveSettingsRaw';
export { saveSettingsToServer } from '../features/apiClient/saveSettingsToServer';
export { saveStateToServer } from '../features/apiClient/saveStateToServer';
export { sendDebugCommand } from '../features/apiClient/sendDebugCommand';
export { sendRestClientRequest } from '../features/apiClient/sendRestClientRequest';
export { startDebugSession } from '../features/apiClient/startDebugSession';
export { trashOnServer } from '../features/apiClient/trashOnServer';
export { searchWorkspace } from '../features/apiClient/searchWorkspace';
export { searchWorkspaceStream } from '../features/apiClient/searchWorkspaceStream';
export { uploadFolder } from '../features/apiClient/uploadFolder';
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
export type { DebugCommand } from '../features/apiClient/sendDebugCommand';
export type { AiContext, AiMessage, AiToolCall } from '../features/apiClient/aiTypes';
export type { AiProviderStatus } from '../features/apiClient/fetchAiProviderStatus';
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
