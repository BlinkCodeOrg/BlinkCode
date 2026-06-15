import { useEffect, useState } from 'react';
import type { EditorAction, FileNode } from '../../types';
import { isOnboardingDismissed } from '../onboarding/isOnboardingDismissed';
import { saveOnboardingDismissed } from '../onboarding/saveOnboardingDismissed';

interface UseEditorOnboardingParams {
  activeFile: FileNode | null;
  dispatch: React.Dispatch<EditorAction>;
}

export function useEditorOnboarding({
  activeFile,
  dispatch,
}: UseEditorOnboardingParams) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (!activeFile) {
      setShowOnboarding(!isOnboardingDismissed());
    } else {
      setShowOnboarding(false);
    }
  }, [activeFile]);

  const dismissOnboarding = () => {
    if (dontShowAgain) {
      saveOnboardingDismissed();
    }

    dispatch({
      type: 'RESTORE_STATE',
      payload: { onboardingDismissed: dontShowAgain },
    });
    setShowOnboarding(false);
  };

  return {
    dontShowAgain,
    setDontShowAgain,
    showOnboarding,
    dismissOnboarding,
  };
}
