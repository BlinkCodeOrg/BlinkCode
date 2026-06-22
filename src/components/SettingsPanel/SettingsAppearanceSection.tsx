import { useRef } from 'react';
import type { EditorSettings } from '../../types';
import { THEME_LIST, type ThemeName } from '../../store/EditorContext';
import ColorPicker from '../common/ColorPicker';
import { Select } from '../ui/Select';
import { Switch } from '../ui/Switch';
import { ThemeImportButton } from './ThemeImportButton';
import { useExtensionFeature } from '../../features/extensions/ExtensionContext';
import { SettingsNumberStepper } from './SettingsNumberStepper';
import { SettingsRow } from './SettingsRow';
import {
  officialEditorBackgrounds,
  normalizeEditorBackgroundPreset,
  type EditorBackgroundPreset,
} from '../../features/editorSettings/editorBackgrounds';

export default function SettingsAppearanceSection({ s, tt, updateSettings }: { s: EditorSettings; tt: (key: string) => string; updateSettings: (settings: Partial<EditorSettings>) => void }) {
  const themeImportEnabled = useExtensionFeature('theme-import');
  const editorBackgroundInputRef = useRef<HTMLInputElement | null>(null);
  const selectedEditorBackground = normalizeEditorBackgroundPreset(s.editorBackgroundPreset);
  const importEditorBackground = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateSettings({
        editorBackgroundPreset: 'custom',
        editorBackgroundCustom: String(reader.result || ''),
      });
    };
    reader.readAsDataURL(file);
  };
  return (
                <div className="settings-section">
                  <div className="settings-section-title">{tt('settings.appearance')}</div>
                  <div className="settings-section-desc">{tt('settings.appearance.desc')}</div>

                  <SettingsRow name={tt('settings.uiDensity')} description={tt('settings.uiDensity.desc')}>
                    <Select
                      ariaLabel={tt('settings.uiDensity')}
                      options={['compact', 'default', 'comfortable'].map(value => ({ value, label: tt(`density.${value}`) }))}
                      value={s.uiDensity}
                      onChange={value => updateSettings({ uiDensity: value as EditorSettings['uiDensity'], compactMode: value === 'compact' })}
                    />
                  </SettingsRow>

                  <SettingsRow name={tt('settings.uiScale')} description={tt('settings.uiScale.desc')}>
                    <SettingsNumberStepper min={80} max={140} value={s.uiScale} onChange={uiScale => updateSettings({ uiScale })} />
                  </SettingsRow>

                  <SettingsRow name={tt('settings.explorerRowHeight')} description={tt('settings.explorerRowHeight.desc')}>
                    <SettingsNumberStepper min={20} max={34} value={s.explorerRowHeight} onChange={explorerRowHeight => updateSettings({ explorerRowHeight })} />
                  </SettingsRow>

                  <SettingsRow name={tt('settings.bottomPanelPosition')} description={tt('settings.bottomPanelPosition.desc')}>
                    <Select
                      ariaLabel={tt('settings.bottomPanelPosition')}
                      options={[
                        { value: 'bottom', label: tt('panelPosition.bottom') },
                        { value: 'right', label: tt('panelPosition.right') },
                      ]}
                      value={s.bottomPanelPosition}
                      onChange={value => updateSettings({ bottomPanelPosition: value as EditorSettings['bottomPanelPosition'] })}
                    />
                  </SettingsRow>
                  <hr className="settings-divider" />

                  <SettingsRow name={tt('settings.editorBackground')} description={tt('settings.editorBackground.desc')}>
                    <Select
                      ariaLabel={tt('settings.editorBackground')}
                      options={[
                        { value: 'none', label: tt('editorBackground.none') },
                        ...officialEditorBackgrounds.map(background => ({ value: background.id, label: tt(background.labelKey) })),
                        { value: 'custom', label: tt('editorBackground.custom') },
                      ]}
                      value={selectedEditorBackground}
                      onChange={value => updateSettings({ editorBackgroundPreset: value as EditorBackgroundPreset })}
                    />
                  </SettingsRow>
                  <div className="settings-editor-bg-layout">
                    <div className="settings-editor-bg-picker">
                      <div className="settings-editor-bg-grid">
                        {([
                          { id: 'none', labelKey: 'editorBackground.none', src: '' },
                          ...officialEditorBackgrounds,
                          { id: 'custom', labelKey: 'editorBackground.custom', src: s.editorBackgroundCustom || '' },
                        ] as const).map(background => (
                          <button
                            key={background.id}
                            type="button"
                            className={`settings-editor-bg-swatch ${background.id === 'none' ? 'settings-editor-bg-none' : ''} ${background.id === 'custom' ? 'settings-editor-bg-custom' : ''} ${selectedEditorBackground === background.id ? 'active' : ''}`}
                            style={background.src ? ({ '--settings-editor-bg-preview': `url("${background.src}")` } as React.CSSProperties) : undefined}
                            onClick={() => {
                              if (background.id === 'custom' && !s.editorBackgroundCustom) {
                                editorBackgroundInputRef.current?.click();
                                return;
                              }
                              updateSettings({ editorBackgroundPreset: background.id });
                            }}
                          >
                            <span>{tt(background.labelKey)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    {selectedEditorBackground !== 'none' && (
                      <div className="settings-editor-bg-controls">
                        <label className="settings-editor-bg-range">
                          <span>{tt('settings.editorBackground.opacity')}</span>
                          <strong>{s.editorBackgroundOpacity}%</strong>
                          <input type="range" min={5} max={70} value={s.editorBackgroundOpacity} onChange={event => updateSettings({ editorBackgroundOpacity: Number(event.currentTarget.value) })} />
                        </label>
                        <label className="settings-editor-bg-range">
                          <span>{tt('settings.editorBackground.blur')}</span>
                          <strong>{s.editorBackgroundBlur} {tt('settings.unit.px')}</strong>
                          <input type="range" min={0} max={16} value={s.editorBackgroundBlur} onChange={event => updateSettings({ editorBackgroundBlur: Number(event.currentTarget.value) })} />
                        </label>
                        <label className="settings-editor-bg-range">
                          <span>{tt('settings.editorBackground.scale')}</span>
                          <strong>{s.editorBackgroundScale}%</strong>
                          <input type="range" min={100} max={140} value={s.editorBackgroundScale} onChange={event => updateSettings({ editorBackgroundScale: Number(event.currentTarget.value) })} />
                        </label>
                        <label className="settings-editor-bg-range">
                          <span>{tt('settings.editorBackground.brightness')}</span>
                          <strong>{s.editorBackgroundBrightness}%</strong>
                          <input type="range" min={45} max={115} value={s.editorBackgroundBrightness} onChange={event => updateSettings({ editorBackgroundBrightness: Number(event.currentTarget.value) })} />
                        </label>
                      </div>
                    )}
                    <div className="settings-editor-bg-actions">
                      <input
                        ref={editorBackgroundInputRef}
                        className="settings-theme-file-input"
                        type="file"
                        accept="image/*"
                        onChange={event => importEditorBackground(event.target.files?.[0])}
                      />
                      <button className="settings-editor-bg-action" type="button" onClick={() => editorBackgroundInputRef.current?.click()}>
                        {tt('settings.editorBackground.upload')}
                      </button>
                      {s.editorBackgroundCustom && (
                        <button className="settings-editor-bg-action danger" type="button" onClick={() => updateSettings({ editorBackgroundCustom: null, editorBackgroundPreset: 'none' })}>
                          {tt('settings.editorBackground.remove')}
                        </button>
                      )}
                    </div>
                  </div>
                  <hr className="settings-divider" />

                  <div className="settings-row">
                    <div className="settings-row-label">
                      <div>
                        <div className="settings-row-name">{tt('settings.colorScheme')}</div>
                        <div className="settings-row-desc">{tt('settings.colorScheme.desc')}</div>
                      </div>
                    </div>
                    <div className="settings-row-control">
                      <Select
                        ariaLabel={tt('settings.colorScheme')}
                        options={[
                          { value: 'dark', label: tt('colorScheme.dark') },
                          { value: 'light', label: tt('colorScheme.light') },
                          { value: 'system', label: tt('colorScheme.system') },
                        ]}
                        value={s.colorScheme}
                        onChange={v => updateSettings({ colorScheme: v as 'dark' | 'light' | 'system' })}
                      />
                    </div>
                  </div>
                  <hr className="settings-divider" />

                  <div className="settings-row">
                    <div className="settings-row-label">
                      <div>
                        <div className="settings-row-name">{tt('settings.theme')}</div>
                        <div className="settings-row-desc">{tt('settings.theme.desc')}</div>
                      </div>
                    </div>
                    <div className="settings-row-control">
                      <Select
                        ariaLabel={tt('settings.theme')}
                        options={THEME_LIST.map(t => ({ value: t.id, label: tt('theme.' + t.id) }))}
                        value={s.theme}
                        onChange={v => updateSettings({ theme: v as ThemeName })}
                      />
                    </div>
                  </div>
                  <div className="settings-theme-desc">
                    {THEME_LIST.find(t => t.id === s.theme)?.url ? (
                      <>{tt('theme.' + s.theme + '.desc')} <a href={THEME_LIST.find(t => t.id === s.theme)?.url} target="_blank" rel="noopener noreferrer" className="theme-link">{THEME_LIST.find(t => t.id === s.theme)?.url?.replace('https://github.com/', '')}</a></>
                    ) : (
                      tt('theme.' + s.theme + '.desc')
                    )}
                  </div>
                  {themeImportEnabled && <ThemeImportButton importedTheme={s.importedTheme} updateSettings={updateSettings} />}
                  <hr className="settings-divider" />

                  <div className="settings-row">
                    <div className="settings-row-label">
                      <div>
                        <div className="settings-row-name">{tt('settings.language')}</div>
                        <div className="settings-row-desc">{tt('settings.language.desc')}</div>
                      </div>
                    </div>
                    <div className="settings-row-control">
                      <Select
                        ariaLabel={tt('settings.language')}
                        options={[
                          { value: 'en', label: 'English' },
                          { value: 'ru', label: 'Русский' },
                        ]}
                        value={s.language}
                        onChange={v => updateSettings({ language: v as 'en' | 'ru' })}
                      />
                    </div>
                  </div>
                  <hr className="settings-divider" />

                  <div className="settings-row">
                    <div className="settings-row-label">
                      <div>
                        <div className="settings-row-name">{tt('settings.animations')}</div>
                        <div className="settings-row-desc">{tt('settings.animations.desc')}</div>
                      </div>
                    </div>
                    <div className="settings-row-control">
                      <Switch value={s.animations} onLabel={tt('on')} offLabel={tt('off')} onChange={animations => updateSettings({ animations })} />
                    </div>
                  </div>
                  <hr className="settings-divider" />

                  <div className="settings-row">
                    <div className="settings-row-label">
                      <div>
                        <div className="settings-row-name">{tt('settings.showFileIcons')}</div>
                        <div className="settings-row-desc">{tt('settings.showFileIcons.desc')}</div>
                      </div>
                    </div>
                    <div className="settings-row-control">
                      <Switch value={s.showFileIcons} onLabel={tt('on')} offLabel={tt('off')} onChange={showFileIcons => updateSettings({ showFileIcons })} />
                    </div>
                  </div>
                  <hr className="settings-divider" />

                  <div className="settings-row">
                    <div className="settings-row-label">
                      <div>
                        <div className="settings-row-name">{tt('settings.compactMode')}</div>
                        <div className="settings-row-desc">{tt('settings.compactMode.desc')}</div>
                      </div>
                    </div>
                    <div className="settings-row-control">
                      <Switch value={s.compactMode} onLabel={tt('on')} offLabel={tt('off')} onChange={compactMode => updateSettings({ compactMode })} />
                    </div>
                  </div>
                  <hr className="settings-divider" />

                  <div className="settings-row">
                    <div className="settings-row-label">
                      <div>
                        <div className="settings-row-name">{tt('settings.backgroundStyle')}</div>
                        <div className="settings-row-desc">{tt('settings.backgroundStyle.desc')}</div>
                      </div>
                    </div>
                    <div className="settings-row-control">
                      <Select
                        ariaLabel={tt('settings.backgroundStyle')}
                        options={[
                          { value: 'dotgrid', label: tt('backgroundStyle.dotgrid') },
                          { value: 'solid', label: tt('backgroundStyle.solid') },
                        ]}
                        value={s.backgroundStyle}
                        onChange={v => updateSettings({ backgroundStyle: v as 'dotgrid' | 'solid' })}
                      />
                    </div>
                  </div>
                  <hr className="settings-divider" />

                  <div className="settings-row">
                    <div className="settings-row-label">
                      <div>
                        <div className="settings-row-name">{tt('settings.dotGridColor')}</div>
                        <div className="settings-row-desc">{tt('settings.dotGridColor.desc')}</div>
                      </div>
                    </div>
                    <div className="settings-row-control">
                      <ColorPicker value={s.dotGridColor} onChange={c => updateSettings({ dotGridColor: c })} direction="up" />
                    </div>
                  </div>
                </div>

  );
}
