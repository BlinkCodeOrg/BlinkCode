import { useEffect, useRef, type RefObject } from 'react';
import type { EditorAction, EditorSettings, EditorState, FileNode } from '../../types';
import { matchKeyCombo } from '../keybindings/matchKeyCombo';
import { isEditableKeyboardTarget } from '../keybindings/isEditableKeyboardTarget';
import { isMonacoKeyboardTarget } from '../keybindings/isMonacoKeyboardTarget';
import { isKeybindingRecordingEvent } from '../settingsKeybindings/isKeybindingRecordingEvent';
import { findNodeById } from '../workspaceTree/findNodeById';
import { commandRegistry } from '../commands/commandRegistry';

interface UseEditorKeybindingsParams {
  dispatch: React.Dispatch<EditorAction>;
  editorRef: RefObject<any>;
  persistFileNode: (file: FileNode, content: string, settings: EditorSettings) => Promise<void>;
  stateRef: RefObject<EditorState>;
}

export function useEditorKeybindings({
  dispatch,
  editorRef,
  persistFileNode,
  stateRef,
}: UseEditorKeybindingsParams) {
  const pendingChord = useRef<{ keys: string; expires: number } | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isKeybindingRecordingEvent(e)) return;
      if (isEditableKeyboardTarget(e.target) && !isMonacoKeyboardTarget(e.target)) return;

      if (e.ctrlKey && !e.altKey) {
        const preventKeys = ['KeyS', 'KeyW', 'KeyN', 'KeyF', 'KeyG', 'KeyH', 'KeyB', 'KeyI', 'Comma', 'Equal', 'Minus', 'Slash'];
        if (preventKeys.includes(e.code)) {
          e.preventDefault();
        }
        if (e.ctrlKey && e.shiftKey && e.code === 'KeyZ') {
          e.preventDefault();
        }
      }
      if (e.altKey && !e.ctrlKey) {
        const altPrevent = ['KeyZ', 'KeyN', 'KeyW'];
        if (altPrevent.includes(e.code)) {
          e.preventDefault();
        }
      }

      const kbs = stateRef.current.settings.keybindings;
      let matchedKeybinding = null as (typeof kbs)[number] | null;
      const pending = pendingChord.current;
      if (pending?.expires && pending.expires > Date.now()) {
        matchedKeybinding = kbs.find(kb => {
          const chord = kb.keys.split(/\s+/);
          return chord.length === 2 && chord[0] === pending.keys && matchKeyCombo(e, chord[1]);
        }) || null;
      }
      if (pending && !matchedKeybinding) pendingChord.current = null;

      for (const kb of kbs) {
        if (matchedKeybinding) break;
        const chord = kb.keys.split(/\s+/);
        if (chord.length === 2) {
          if (matchKeyCombo(e, chord[0])) {
            e.preventDefault();
            e.stopImmediatePropagation();
            pendingChord.current = { keys: chord[0], expires: Date.now() + 1500 };
            return;
          }
          continue;
        }
        if (matchKeyCombo(e, kb.keys)) matchedKeybinding = kb;
      }
      if (!matchedKeybinding) return;

      pendingChord.current = null;
      const monacoAction = commandRegistry.find(command => command.id === matchedKeybinding.id)?.nativeMonaco;
      if (monacoAction) {
        e.preventDefault();
        return;
      }

      e.preventDefault();
      e.stopImmediatePropagation();
      const s = stateRef.current;

      switch (matchedKeybinding.id) {
          case 'commandPalette': window.dispatchEvent(new CustomEvent('blinkcode:toggleCommandPalette')); break;
          case 'quickOpen': window.dispatchEvent(new CustomEvent('blinkcode:openQuickOpen', { detail: { openQuickOpen: true } })); break;
          case 'recentFiles': window.dispatchEvent(new CustomEvent('blinkcode:openQuickOpen', { detail: { openQuickOpen: true, recentOnly: true } })); break;
          case 'workspaceSearch': dispatch({ type: 'TOGGLE_SEARCH_PANEL' }); break;
          case 'sourceControl': dispatch({ type: 'TOGGLE_SOURCE_CONTROL' }); break;
          case 'problemsPanel': dispatch({ type: 'TOGGLE_PROBLEMS_PANEL' }); break;
          case 'splitEditor': {
            const tab = s.openTabs.find(t => t.id === s.activeTabId);
            const file = tab ? findNodeById(s.files, tab.fileId) : null;
            if (tab && !file?.extensionDetail && !s.splitActiveTabId) dispatch({ type: 'SPLIT_TAB', payload: { tabId: tab.id } });
            else if (s.splitActiveTabId) dispatch({ type: 'CLOSE_SPLIT_TAB' });
            break;
          }
          case 'toggleSidebar': dispatch({ type: 'TOGGLE_SIDEBAR' }); break;
          case 'toggleTerminal': dispatch({ type: 'TOGGLE_TERMINAL' }); break;
          case 'toggleAI': dispatch({ type: 'TOGGLE_AI_PANEL' }); break;
          case 'toggleSettings': dispatch({ type: 'TOGGLE_SETTINGS' }); break;
          case 'toggleWordWrap': dispatch({ type: 'UPDATE_SETTINGS', payload: { wordWrap: !s.settings.wordWrap } }); break;
          case 'toggleZenMode': dispatch({ type: 'TOGGLE_ZEN_MODE' }); break;
          case 'zoomIn': dispatch({ type: 'UPDATE_SETTINGS', payload: { fontSize: Math.min(30, s.settings.fontSize + 1) } }); break;
          case 'zoomOut': dispatch({ type: 'UPDATE_SETTINGS', payload: { fontSize: Math.max(8, s.settings.fontSize - 1) } }); break;
          case 'closeTab': { if (s.activeTabId) dispatch({ type: 'CLOSE_TAB', payload: { tabId: s.activeTabId } }); break; }
          case 'closeAllTabs': { s.openTabs.forEach(t => dispatch({ type: 'CLOSE_TAB', payload: { tabId: t.id } })); break; }
          case 'saveAll': {
            s.openTabs.forEach(tab => {
              const file = findNodeById(s.files, tab.fileId);
              if (file?.content !== undefined) {
                persistFileNode(file, file.content, s.settings).catch(() => {});
              }
            });
            break;
          }
          case 'newFile': {
            dispatch({ type: 'SHOW_NEW_FILE', payload: { type: 'file' } });
            if (!s.sidebarVisible) dispatch({ type: 'TOGGLE_SIDEBAR' });
            break;
          }
          case 'save': {
            const tab = s.openTabs.find(t => t.id === s.activeTabId);
            if (tab) {
              const file = findNodeById(s.files, tab.fileId);
              const editorContent = editorRef.current?.getValue?.();
              const content = typeof editorContent === 'string' ? editorContent : file?.content;
              if (file && content !== undefined) {
                persistFileNode({ ...file, content }, content, s.settings).catch(() => {});
              }
            }
            break;
          }
          case 'undo': editorRef.current?.focus(); editorRef.current?.trigger('keyboard', 'undo'); break;
          case 'redo': editorRef.current?.focus(); editorRef.current?.trigger('keyboard', 'redo'); break;
          case 'formatDocument': editorRef.current?.focus(); editorRef.current?.trigger('keyboard', 'editor.action.formatDocument'); break;
          default: break;
      }
    };

    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [dispatch, editorRef, persistFileNode, stateRef]);
}
