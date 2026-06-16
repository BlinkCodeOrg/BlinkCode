import { BugPlay, Files, GitBranch, PackageOpen, Search } from 'lucide-react';
import type { ActivityBarItemId, EditorState } from '../../types';

export interface ActivityBarItemDefinition {
  id: ActivityBarItemId;
  icon: typeof Files;
  labelKey: string;
  testId: string;
  active: (state: EditorState) => boolean;
}

export const ACTIVITY_BAR_ITEMS: ActivityBarItemDefinition[] = [
  {
    id: 'explorer',
    icon: Files,
    labelKey: 'explorer.title',
    testId: 'activity-explorer',
    active: state => state.sidebarVisible
      && !state.showSearchPanel
      && !state.showSourceControl
      && !state.showNpmScripts
      && !state.showDebugPanel,
  },
  { id: 'search', icon: Search, labelKey: 'search.title', testId: 'activity-search', active: state => state.showSearchPanel },
  { id: 'sourceControl', icon: GitBranch, labelKey: 'sc.title', testId: 'activity-source-control', active: state => state.showSourceControl },
  { id: 'debug', icon: BugPlay, labelKey: 'activity.debug', testId: 'activity-debug', active: state => state.showDebugPanel },
  { id: 'npmScripts', icon: PackageOpen, labelKey: 'npmScripts.title', testId: 'activity-npm-scripts', active: state => state.showNpmScripts },
];
