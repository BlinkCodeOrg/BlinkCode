import type { EditorAction, SavedEditorState } from '../../types';
import {
  fetchFileContent,
  fetchRecoveryBuffers,
  fetchSettings,
  fetchState,
  fetchTree,
  openFolderOnServer,
} from '../../utils/api';
import { defaultSettings } from '../editorSettings/defaultSettings';
import { isBinaryBlockedFile } from '../fileSupport/isBinaryBlockedFile';
import { LARGE_FILE_LIMIT } from '../fileSupport/largeFileLimit';
import { findNodeByPath } from '../workspaceTree/findNodeByPath';

export async function loadWorkspaceFromServer(
  dispatch: React.Dispatch<EditorAction>,
): Promise<void> {
  try {
    try {
      const serverSettings = await fetchSettings();
      if (serverSettings?.merged) {
        const localRaw = localStorage.getItem('blinkcode-settings');
        const local = localRaw ? JSON.parse(localRaw) : {};
        const merged = { ...serverSettings.merged, ...local };
        if (!local.keybindings) {
          merged.keybindings = defaultSettings.keybindings;
        }
        dispatch({ type: 'UPDATE_SETTINGS', payload: merged });
      }
    } catch {}

    let saved: SavedEditorState | null = null;
    try {
      saved = await fetchState();
    } catch {}

    if (saved && saved.folderClosed) {
      return;
    }

    if (saved?.workspaceDir) {
      try {
        await openFolderOnServer(saved.workspaceDir);
      } catch {}
      dispatch({ type: 'SET_WORKSPACE_DIR', payload: saved.workspaceDir });
    }

    const { files, workspacePath } = await fetchTree();
    dispatch({ type: 'SET_FILES', payload: files });
    if (!saved?.workspaceDir && workspacePath) {
      dispatch({ type: 'SET_WORKSPACE_DIR', payload: workspacePath });
    }

    if (saved && Object.keys(saved).length > 0) {
      // Settings have their own authoritative persistence. Restoring the legacy
      // copy from editor state can overwrite a newly saved custom background.
      const { settings: _legacySettings, ...savedEditorState } = saved;
      dispatch({ type: 'RESTORE_STATE', payload: savedEditorState });

      if (saved.openTabs && saved.openTabs.length > 0) {
        for (const tabInfo of saved.openTabs) {
          if (
            !tabInfo.isBinary &&
            tabInfo.serverPath &&
            !isBinaryBlockedFile(tabInfo.serverPath)
          ) {
            const file = findNodeByPath(files, tabInfo.serverPath);
            const largeFile =
              typeof file?.size === 'number' && file.size > LARGE_FILE_LIMIT;
            if (file && file.type === 'file' && !largeFile) {
              try {
                const content = await fetchFileContent(file.serverPath!);
                dispatch({
                  type: 'SET_FILE_CONTENT',
                  payload: { fileId: file.id, content },
                });
              } catch {}
            }
          }
        }
      }
    }

    try {
      const recoveryBuffers = await fetchRecoveryBuffers();
      for (const buffer of recoveryBuffers) {
        const file = findNodeByPath(files, buffer.filePath);
        if (
          !file ||
          file.type !== 'file' ||
          file.binary ||
          isBinaryBlockedFile(file.name)
        )
          continue;
        dispatch({
          type: 'UPDATE_FILE_CONTENT',
          payload: { fileId: file.id, content: buffer.content },
        });
        dispatch({ type: 'OPEN_FILE', payload: { file } });
      }
    } catch {}
  } catch {}
}
