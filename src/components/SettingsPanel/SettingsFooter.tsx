import { useAppVersion } from '../../features/appVersion/useAppVersion';

export default function SettingsFooter() {
  const appVersion = useAppVersion();

  return (
    <div className="settings-footer">
      <span className="settings-footer-blink">Blink</span>
      <span className="settings-footer-code">Code</span>
      <span className="settings-footer-version">v{appVersion}</span>
    </div>
  );
}
