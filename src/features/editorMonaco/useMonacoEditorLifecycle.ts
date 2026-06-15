import { useCallback, useEffect, useRef } from 'react';
import type { OnMount } from '@monaco-editor/react';
import type { EditorSettings, FileNode } from '../../types';
import { attachLspToEditor } from '../../lsp/session';
import { getMonacoLanguage } from '../../utils/supportedWebFiles';
import { getMonacoTheme } from '../editorTheme/getMonacoTheme';
import { registerBlinkThemes } from '../editorTheme/registerBlinkThemes';
import { createEditorLiveOptions } from '../editorOptions/createEditorLiveOptions';
import { createEditorMountOptions } from '../editorOptions/createEditorMountOptions';
import { fetchFileCursorPosition, saveFileCursorPosition } from '../../utils/api';
import { attachDebugBreakpoints } from '../debugger/attachDebugBreakpoints';
import { attachTailwindSortAction, refreshTailwindMarkers, registerTailwindTooling } from '../tailwind/registerTailwindTooling';
import { registerAiInlineCompletions } from '../ai/registerAiInlineCompletions';
import { registerSchemaTooling } from '../schemaTooling/registerSchemaTooling';
import { registerEnvTooling } from '../envEditor/registerEnvTooling';
import { registerSnippetTooling } from '../snippets/registerSnippetTooling';
import { refreshSpellMarkers, registerSpellChecker } from '../spellChecker/registerSpellChecker';
import { attachEnvSecretMasking } from '../envEditor/attachEnvSecretMasking';
import { registerImportedTheme } from '../editorTheme/registerImportedTheme';
import { applyEditorConfigToEditor } from './applyEditorConfigToEditor';
import { AI_QUICK_ACTIONS } from '../ai/aiQuickActions';
import { t } from '../../utils/i18n';
import { useExtensionFeature } from '../extensions/ExtensionContext';

interface UseMonacoEditorLifecycleParams {
  activeFile: FileNode | null;
  group: 'primary' | 'secondary';
  registerEditor: (editor: any) => void;
  settings: EditorSettings;
  workspaceDir: string;
}

export function useMonacoEditorLifecycle({
  activeFile,
  group,
  registerEditor,
  settings,
  workspaceDir,
}: UseMonacoEditorLifecycleParams) {
  const spellCheckerExtension = useExtensionFeature('spell-checker');
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const cursorSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debugBreakpointsRef = useRef<{ render: () => void; dispose: () => void } | null>(null);
  const tailwindSortRef = useRef<{ dispose: () => void } | null>(null);
  const envMaskRef = useRef<{ render: () => void; dispose: () => void } | null>(null);
  const editorConfigModelRef = useRef<{ dispose: () => void } | null>(null);
  const activeFileRef = useRef(activeFile);
  const settingsRef = useRef(settings);
  activeFileRef.current = activeFile;
  settingsRef.current = settings;
  (window as any).__blinkcodeSettings = settings;

  useEffect(() => () => {
    if (cursorSaveTimer.current) clearTimeout(cursorSaveTimer.current);
    debugBreakpointsRef.current?.dispose();
    tailwindSortRef.current?.dispose();
    envMaskRef.current?.dispose();
    editorConfigModelRef.current?.dispose();
  }, []);

  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel?.();
      if (model && activeFile?.name) {
        monacoRef.current.editor.setModelLanguage(model, getMonacoLanguage(activeFile.name));
      }
      editorRef.current.updateOptions(createEditorLiveOptions(settings));
      registerSnippetTooling(monacoRef.current, settings.snippets);
      registerImportedTheme(monacoRef.current, settings.importedTheme);
      const themeName = getMonacoTheme(settings.theme, settings.colorScheme);
      monacoRef.current.editor.setTheme(themeName);
      debugBreakpointsRef.current?.render();
      refreshTailwindMarkers();
      envMaskRef.current?.render();
      refreshSpellMarkers();
    }
  }, [activeFile?.id, activeFile?.name, settings, spellCheckerExtension]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !activeFile?.serverPath || activeFile.serverPath.startsWith('__')) return;
    applyEditorConfigToEditor(editor, activeFile.serverPath, {
      insertSpaces: settings.insertSpaces,
      tabSize: settings.tabSize,
    }).catch(() => {});
  }, [activeFile?.serverPath, settings.insertSpaces, settings.tabSize]);

  useEffect(() => {
    const editor = editorRef.current;
    const serverPath = activeFile?.serverPath;
    if (!editor || !serverPath || serverPath.startsWith('__')) return;

    let cancelled = false;
    fetchFileCursorPosition(serverPath)
      .then(position => {
        if (cancelled || !position) return;
        if (position.viewState) {
          editor.restoreViewState(position.viewState);
          editor.focus();
          return;
        }

        editor.setPosition({ lineNumber: position.line, column: position.column });
        editor.revealLineInCenterIfOutsideViewport?.(position.line);
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [activeFile?.id, activeFile?.serverPath]);

  useEffect(() => {
    const handler = (event: Event) => {
      const editor = editorRef.current;
      const detail = (event as CustomEvent).detail;
      if (!editor || detail?.path !== activeFile?.serverPath) return;
      const max = Math.max(0, editor.getScrollHeight() - editor.getLayoutInfo().height);
      editor.setScrollTop(max * Number(detail.ratio || 0), 0);
    };
    window.addEventListener('blinkcode:markdownPreviewScroll', handler);
    return () => window.removeEventListener('blinkcode:markdownPreviewScroll', handler);
  }, [activeFile?.serverPath]);

  const handleMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    (window as any).monaco = monaco;

    const mountedModel = editor.getModel?.();
    if (mountedModel && activeFile?.name) {
      monaco.editor.setModelLanguage(mountedModel, getMonacoLanguage(activeFile.name));
    }
    if (group === 'primary') registerEditor(editor);

    const currentSettings = settingsRef.current;
    registerBlinkThemes(monaco, currentSettings.importedTheme);
    const themeName = getMonacoTheme(currentSettings.theme, currentSettings.colorScheme);
    monaco.editor.setTheme(themeName);
    editor.updateOptions(createEditorMountOptions(currentSettings));
    debugBreakpointsRef.current?.dispose();
    debugBreakpointsRef.current = attachDebugBreakpoints(
      monaco,
      editor,
      () => activeFileRef.current?.serverPath,
    );
    if (currentSettings.tailwindTooling) registerTailwindTooling(monaco);
    if (currentSettings.aiInlineCompletions) registerAiInlineCompletions(monaco);
    registerSchemaTooling(monaco);
    registerEnvTooling(monaco);
    registerSnippetTooling(monaco, currentSettings.snippets);
    if (spellCheckerExtension) registerSpellChecker(monaco);
    editorConfigModelRef.current?.dispose();
    editorConfigModelRef.current = editor.onDidChangeModel?.(() => {
      const file = activeFileRef.current;
      if (file?.serverPath) {
        applyEditorConfigToEditor(editor, file.serverPath, settingsRef.current).catch(() => {});
      }
    }) || null;
    if (activeFileRef.current?.serverPath) {
      applyEditorConfigToEditor(editor, activeFileRef.current.serverPath, currentSettings).catch(() => {});
    }
    AI_QUICK_ACTIONS.forEach(action => {
      editor.addAction({
        id: `blinkcode.ai.${action.id}`,
        label: t('ai.contextAction', currentSettings.language, { action: t(action.labelKey, currentSettings.language) }),
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 50,
        run: () => {
          window.dispatchEvent(new CustomEvent('blinkcode:aiQuickAction', { detail: { action: action.id } }));
        },
      });
    });
    envMaskRef.current?.dispose();
    envMaskRef.current = attachEnvSecretMasking(monaco, editor, () => settingsRef.current.envMaskSecrets);
    tailwindSortRef.current?.dispose();
    tailwindSortRef.current = currentSettings.tailwindClassSorting
      ? attachTailwindSortAction(monaco, editor)
      : null;

    editor.onDidChangeCursorPosition((event: any) => {
      window.dispatchEvent(new CustomEvent('blinkcode:cursorPosition', {
        detail: { line: event.position.lineNumber, column: event.position.column },
      }));

      scheduleFileViewStateSave(editor);
    });

    editor.onDidScrollChange(() => {
      scheduleFileViewStateSave(editor);
      const path = activeFileRef.current?.serverPath;
      if (path && /\.(md|mdx|markdown)$/i.test(path)) {
        const max = Math.max(1, editor.getScrollHeight() - editor.getLayoutInfo().height);
        window.dispatchEvent(new CustomEvent('blinkcode:markdownEditorScroll', {
          detail: { path, ratio: editor.getScrollTop() / max },
        }));
      }
    });

    function scheduleFileViewStateSave(currentEditor: any) {
      const serverPath = activeFileRef.current?.serverPath;
      if (!serverPath || serverPath.startsWith('__')) return;
      if (cursorSaveTimer.current) clearTimeout(cursorSaveTimer.current);
      cursorSaveTimer.current = setTimeout(() => {
        const position = currentEditor.getPosition?.();
        if (!position) return;
        const viewState = currentEditor.saveViewState?.();
        saveFileCursorPosition(serverPath, position.lineNumber, position.column, viewState).catch(() => {});
      }, 500);
    }

    try { attachLspToEditor(monaco, editor, workspaceDir || ''); } catch {}
  }, [activeFile?.name, group, registerEditor, spellCheckerExtension, workspaceDir]);

  return {
    editorRef,
    handleMount,
    monacoRef,
  };
}
