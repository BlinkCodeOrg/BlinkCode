import type { EditorAction, FileNode } from '../../types';
import { fetchFileContent, fetchLargeFilePreview } from '../../utils/api';
import { isBinaryBlockedFile } from '../fileSupport/isBinaryBlockedFile';
import { LARGE_FILE_LIMIT } from '../fileSupport/largeFileLimit';
import { v4 as uuid } from 'uuid';
import { t } from '../../utils/i18n';

export async function openFileForEditor(
  file: FileNode,
  dispatch: React.Dispatch<EditorAction>,
  language = 'en',
): Promise<void> {
  const isBlockedBinary = file.type === 'file' && isBinaryBlockedFile(file.name);
  const isLargeFile = file.type === 'file' && typeof file.size === 'number' && file.size > LARGE_FILE_LIMIT;
  dispatch({ type: 'OPEN_FILE', payload: { file } });

  if (file.type === 'file' && !file.binary && !isBlockedBinary && !isLargeFile && file.content === undefined && file.serverPath) {
    try {
      const content = await fetchFileContent(file.serverPath);
      dispatch({ type: 'SET_FILE_CONTENT', payload: { fileId: file.id, content } });
    } catch (error) {
      const id = uuid();
      const reason = error instanceof Error ? error.message : t('common.unknownError', language);
      dispatch({
        type: 'ADD_TOAST',
        payload: { id, message: t('file.openFailed', language, { name: file.name, error: reason }), type: 'error' },
      });
      setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: { id } }), 7000);
    }
  }
  if (file.type === 'file' && (file.binary || isBlockedBinary || isLargeFile)) {
    dispatch({ type: 'SET_FILE_CONTENT', payload: { fileId: file.id, content: '' } });
  }
  if (isLargeFile && file.serverPath) {
    try {
      const preview = await fetchLargeFilePreview(file.serverPath);
      dispatch({
        type: 'SET_LARGE_FILE_PREVIEW',
        payload: { fileId: file.id, content: preview.content, offset: preview.offset, done: preview.done },
      });
    } catch {}
  }
}
