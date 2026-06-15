export function saveOnboardingDismissed(): void {
  try {
    localStorage.setItem('blinkcode-onboarding-dismissed', 'true');
  } catch {}
}
