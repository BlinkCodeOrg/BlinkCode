import type { DebugSessionState } from '../apiClient/debuggerTypes';

export const debugIdleState: DebugSessionState = {
  status: 'idle',
  breakpoints: [],
  breakpointDetails: [],
  callFrames: [],
  output: [],
};
