export interface RecoverableDiagnostic {
  area: string;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

export function reportRecoverableError(
  area: string,
  error: unknown,
  context?: Record<string, unknown>,
): RecoverableDiagnostic {
  const diagnostic: RecoverableDiagnostic = {
    area,
    message: error instanceof Error ? error.message : String(error || 'Unknown error'),
    context,
    timestamp: new Date().toISOString(),
  };
  console.warn(`[BlinkCode:${area}] ${diagnostic.message}`, context || '');
  window.dispatchEvent(new CustomEvent('blinkcode:diagnostic', { detail: diagnostic }));
  return diagnostic;
}
