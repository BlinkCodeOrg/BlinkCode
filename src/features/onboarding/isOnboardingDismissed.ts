export function isOnboardingDismissed(): boolean {
  try {
    return localStorage.getItem('blinkcode-onboarding-dismissed') === 'true';
  } catch {
    return false;
  }
}
