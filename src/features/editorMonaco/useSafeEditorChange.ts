import { useCallback, type MutableRefObject } from 'react';
import type { FileNode } from '../../types';
import { doesEditorModelMatchFile } from './doesEditorModelMatchFile';

export function useSafeEditorChange({
  activeFile,
  editorRef,
  readOnly,
  updateFileContent,
}: {
  activeFile: FileNode | null;
  editorRef: MutableRefObject<any>;
  readOnly: boolean;
  updateFileContent: (fileId: string, content: string) => void;
}) {
  return useCallback(
    (value: string | undefined) => {
      if (!activeFile || value === undefined || readOnly) return;
      const fileKey = activeFile.serverPath || activeFile.id;
      if (!doesEditorModelMatchFile(editorRef.current, fileKey)) return;
      updateFileContent(activeFile.id, value);
    },
    [activeFile, editorRef, readOnly, updateFileContent],
  );
}
