import { useRef } from 'react';
import type { EditorSettings } from '../../types';
import {
  officialEditorBackgrounds,
  normalizeEditorBackgroundPreset,
  type EditorBackgroundPreset,
} from '../../features/editorSettings/editorBackgrounds';
import { Select } from '../ui/Select';
import { SettingsRow } from './SettingsRow';

interface EditorBackgroundSettingsProps {
  s: EditorSettings;
  tt: (key: string) => string;
  updateSettings: (settings: Partial<EditorSettings>) => void;
}

export function EditorBackgroundSettings({ s, tt, updateSettings }: EditorBackgroundSettingsProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const selected = normalizeEditorBackgroundPreset(s.editorBackgroundPreset);
  const importBackground = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => updateSettings({
      editorBackgroundPreset: 'custom',
      editorBackgroundCustom: String(reader.result || ''),
    });
    reader.readAsDataURL(file);
  };

  const backgrounds = [
    { id: 'none', labelKey: 'editorBackground.none', src: '' },
    ...officialEditorBackgrounds,
    { id: 'custom', labelKey: 'editorBackground.custom', src: s.editorBackgroundCustom || '' },
  ] as const;

  return (
    <>
      <SettingsRow name={tt('settings.editorBackground')} description={tt('settings.editorBackground.desc')}>
        <Select
          ariaLabel={tt('settings.editorBackground')}
          options={backgrounds.map(background => ({ value: background.id, label: tt(background.labelKey) }))}
          value={selected}
          onChange={value => updateSettings({ editorBackgroundPreset: value as EditorBackgroundPreset })}
        />
      </SettingsRow>
      <div className="settings-editor-bg-layout">
        <div className="settings-editor-bg-picker">
          <div className="settings-editor-bg-grid">
            {backgrounds.map(background => (
              <button
                key={background.id}
                type="button"
                className={`settings-editor-bg-swatch ${background.id === 'none' ? 'settings-editor-bg-none' : ''} ${background.id === 'custom' ? 'settings-editor-bg-custom' : ''} ${selected === background.id ? 'active' : ''}`}
                style={background.src ? ({ '--settings-editor-bg-preview': `url("${background.src}")` } as React.CSSProperties) : undefined}
                onClick={() => {
                  if (background.id === 'custom' && !s.editorBackgroundCustom) inputRef.current?.click();
                  else updateSettings({ editorBackgroundPreset: background.id });
                }}
              >
                <span>{tt(background.labelKey)}</span>
              </button>
            ))}
          </div>
        </div>
        {selected !== 'none' && (
          <div className="settings-editor-bg-controls">
            <BackgroundRange label={tt('settings.editorBackground.opacity')} value={s.editorBackgroundOpacity} min={5} max={70} suffix="%" onChange={editorBackgroundOpacity => updateSettings({ editorBackgroundOpacity })} />
            <BackgroundRange label={tt('settings.editorBackground.blur')} value={s.editorBackgroundBlur} min={0} max={16} suffix={` ${tt('settings.unit.px')}`} onChange={editorBackgroundBlur => updateSettings({ editorBackgroundBlur })} />
            <BackgroundRange label={tt('settings.editorBackground.scale')} value={s.editorBackgroundScale} min={100} max={140} suffix="%" onChange={editorBackgroundScale => updateSettings({ editorBackgroundScale })} />
            <BackgroundRange label={tt('settings.editorBackground.brightness')} value={s.editorBackgroundBrightness} min={45} max={115} suffix="%" onChange={editorBackgroundBrightness => updateSettings({ editorBackgroundBrightness })} />
          </div>
        )}
        <div className="settings-editor-bg-actions">
          <input ref={inputRef} className="settings-theme-file-input" type="file" accept="image/*" onChange={event => importBackground(event.target.files?.[0])} />
          <button className="settings-editor-bg-action" type="button" onClick={() => inputRef.current?.click()}>{tt('settings.editorBackground.upload')}</button>
          {s.editorBackgroundCustom && (
            <button className="settings-editor-bg-action danger" type="button" onClick={() => updateSettings({ editorBackgroundCustom: null, editorBackgroundPreset: 'none' })}>{tt('settings.editorBackground.remove')}</button>
          )}
        </div>
      </div>
      <hr className="settings-divider" />
    </>
  );
}

function BackgroundRange({ label, value, min, max, suffix, onChange }: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="settings-editor-bg-range">
      <span>{label}</span>
      <strong>{value}{suffix}</strong>
      <input type="range" min={min} max={max} value={value} onChange={event => onChange(Number(event.currentTarget.value))} />
    </label>
  );
}
