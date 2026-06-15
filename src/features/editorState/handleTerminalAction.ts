import type { EditorAction, EditorState } from '../../types';

type TerminalAction = Extract<
  EditorAction,
  | { type: 'TOGGLE_TERMINAL' }
  | { type: 'SET_TERMINAL_HEIGHT' }
  | { type: 'ADD_TERMINAL_INSTANCE' }
  | { type: 'REMOVE_TERMINAL_INSTANCE' }
  | { type: 'SET_ACTIVE_TERMINAL' }
  | { type: 'UPDATE_TERMINAL_CWD' }
  | { type: 'SET_TERMINAL_STATUS' }
  | { type: 'ADD_TERMINAL_LINE' }
  | { type: 'CLEAR_TERMINAL' }
>;

export function handleTerminalAction(state: EditorState, action: TerminalAction): EditorState {
  switch (action.type) {
    case 'TOGGLE_TERMINAL': {
      const open = !state.terminalOpen || !state.bottomPanelOpen || state.bottomPanelTab !== 'terminal';
      return { ...state, terminalOpen: open, bottomPanelOpen: open, bottomPanelTab: 'terminal' };
    }
    case 'SET_TERMINAL_HEIGHT':
      return { ...state, terminalHeight: Math.max(120, Math.min(500, action.payload.height)) };
    case 'ADD_TERMINAL_INSTANCE': {
      const inst = {
        ...action.payload,
        cwd: action.payload.cwd || '',
        title: action.payload.title || action.payload.name,
        cursor: action.payload.cursor || 0,
      };
      return {
        ...state,
        terminalInstances: [...state.terminalInstances, inst],
        activeTerminalId: inst.id,
        terminalOpen: true,
        bottomPanelOpen: true,
        bottomPanelTab: 'terminal',
      };
    }
    case 'REMOVE_TERMINAL_INSTANCE': {
      const { id } = action.payload;
      const instances = state.terminalInstances.filter(term => term.id !== id);
      let activeId = state.activeTerminalId;
      if (activeId === id) {
        activeId = instances.length > 0 ? instances[instances.length - 1].id : null;
      }
      return {
        ...state,
        terminalInstances: instances,
        activeTerminalId: activeId,
        terminalOpen: instances.length > 0,
        bottomPanelOpen: instances.length > 0,
      };
    }
    case 'SET_ACTIVE_TERMINAL':
      return { ...state, activeTerminalId: action.payload.id };
    case 'UPDATE_TERMINAL_CWD':
      return {
        ...state,
        terminalInstances: state.terminalInstances.map(term =>
          term.id === action.payload.instanceId ? { ...term, cwd: action.payload.cwd } : term
        ),
      };
    case 'SET_TERMINAL_STATUS':
      return {
        ...state,
        terminalInstances: state.terminalInstances.map(term =>
          term.id === action.payload.instanceId
            ? { ...term, status: action.payload.status, exitCode: action.payload.exitCode }
            : term
        ),
      };
    case 'ADD_TERMINAL_LINE':
      return state;
    case 'CLEAR_TERMINAL':
      return { ...state, terminalInstances: state.terminalInstances };
  }
}
