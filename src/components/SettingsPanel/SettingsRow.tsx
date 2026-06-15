interface SettingsRowProps {
  children: React.ReactNode;
  description: string;
  name: string;
}

export function SettingsRow({
  children,
  description,
  name,
}: SettingsRowProps) {
  return (
    <>
      <div className="settings-row">
        <div className="settings-row-label">
          <div>
            <div className="settings-row-name">{name}</div>
            <div className="settings-row-desc">{description}</div>
          </div>
        </div>
        <div className="settings-row-control">
          {children}
        </div>
      </div>
      <hr className="settings-divider" />
    </>
  );
}
