import type { EditorAction, EditorState } from '../../types';

type BrowserAction = Extract<
  EditorAction,
  | { type: 'OPEN_BROWSER_PREVIEW' }
  | { type: 'CLOSE_BROWSER_PREVIEW' }
  | { type: 'SET_BROWSER_URL' }
  | { type: 'SET_BROWSER_LOADING' }
  | { type: 'SET_BROWSER_NAV_STATE' }
  | { type: 'SET_BROWSER_ERROR' }
>;

export function handleBrowserAction(state: EditorState, action: BrowserAction): EditorState {
  switch (action.type) {
    case 'OPEN_BROWSER_PREVIEW':
      return {
        ...state,
        browserOpen: true,
        browserUrl: action.payload.url,
        browserLoading: true,
        browserCanGoBack: false,
        browserCanGoForward: false,
        browserError: null,
      };
    case 'CLOSE_BROWSER_PREVIEW':
      return {
        ...state,
        browserOpen: false,
        browserLoading: false,
        browserCanGoBack: false,
        browserCanGoForward: false,
        browserError: null,
      };
    case 'SET_BROWSER_URL':
      return { ...state, browserUrl: action.payload.url };
    case 'SET_BROWSER_LOADING':
      return { ...state, browserLoading: action.payload.loading };
    case 'SET_BROWSER_NAV_STATE':
      return {
        ...state,
        browserCanGoBack: action.payload.canGoBack,
        browserCanGoForward: action.payload.canGoForward,
      };
    case 'SET_BROWSER_ERROR':
      return { ...state, browserError: action.payload.error };
  }
}
