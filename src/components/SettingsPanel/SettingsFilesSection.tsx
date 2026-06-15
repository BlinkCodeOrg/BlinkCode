import type { EditorSettings } from '../../types';
import { Select } from '../ui/Select';
import { Switch } from '../ui/Switch';
import { useExtensionFeature } from '../../features/extensions/ExtensionContext';


export default function SettingsFilesSection({ s, tt, updateSettings }: { s: EditorSettings; tt: (key: string) => string; updateSettings: (settings: Partial<EditorSettings>) => void }) {
  const spellCheckerEnabled = useExtensionFeature('spell-checker');
  return (
                <div className="settings-section">
                  <div className="settings-section-title">{tt('settings.files')}</div>
                  <div className="settings-section-desc">{tt('settings.files.desc')}</div>

                  <div className="settings-row">
                    <div className="settings-row-label">
                      <div>
                        <div className="settings-row-name">{tt('settings.autoSaveDelay')}</div>
                        <div className="settings-row-desc">{tt('settings.autoSaveDelay.desc')}</div>
                      </div>
                    </div>
                    <div className="settings-row-control">
                      <Select
                        ariaLabel={tt('settings.autoSaveDelay')}
                        options={[
                          { value: 0, label: tt('settings.off') },
                          { value: 300, label: '300ms' },
                          { value: 1000, label: '1s' },
                          { value: 2000, label: '2s' },
                        ]}
                        value={s.autoSaveDelay}
                        onChange={v => updateSettings({ autoSaveDelay: v as number })}
                      />
                    </div>
                  </div>
                  <hr className="settings-divider" />

                  <div className="settings-row">
                    <div className="settings-row-label">
                      <div>
                        <div className="settings-row-name">{tt('settings.envMask')}</div>
                        <div className="settings-row-desc">{tt('settings.envMask.desc')}</div>
                      </div>
                    </div>
                    <div className="settings-row-control">
                      <Switch value={s.envMaskSecrets} onLabel={tt('on')} offLabel={tt('off')} onChange={envMaskSecrets => updateSettings({ envMaskSecrets })} />
                    </div>
                  </div>
                  <hr className="settings-divider" />

                  {spellCheckerEnabled && <div className="settings-row">
                    <div className="settings-row-label">
                      <div>
                        <div className="settings-row-name">{tt('settings.spellChecker')}</div>
                        <div className="settings-row-desc">{tt('settings.spellChecker.desc')}</div>
                      </div>
                    </div>
                    <div className="settings-row-control">
                      <Switch value={s.spellChecker} onLabel={tt('on')} offLabel={tt('off')} onChange={spellChecker => updateSettings({ spellChecker })} />
                    </div>
                  </div>}
                  {spellCheckerEnabled && <hr className="settings-divider" />}

                  <div className="settings-row">
                    <div className="settings-row-label">
                      <div>
                        <div className="settings-row-name">{tt('settings.insertFinalNewline')}</div>
                        <div className="settings-row-desc">{tt('settings.insertFinalNewline.desc')}</div>
                      </div>
                    </div>
                    <div className="settings-row-control">
                      <Switch value={s.insertFinalNewline} onLabel={tt('on')} offLabel={tt('off')} onChange={insertFinalNewline => updateSettings({ insertFinalNewline })} />
                    </div>
                  </div>
                  <hr className="settings-divider" />

                  <div className="settings-row">
                    <div className="settings-row-label">
                      <div>
                        <div className="settings-row-name">{tt('settings.autoSaveOnFocusChange')}</div>
                        <div className="settings-row-desc">{tt('settings.autoSaveOnFocusChange.desc')}</div>
                      </div>
                    </div>
                    <div className="settings-row-control">
                      <Switch value={s.autoSaveOnFocusChange} onLabel={tt('on')} offLabel={tt('off')} onChange={autoSaveOnFocusChange => updateSettings({ autoSaveOnFocusChange })} />
                    </div>
                  </div>
                  <hr className="settings-divider" />

                  <div className="settings-row">
                    <div className="settings-row-label">
                      <div>
                        <div className="settings-row-name">{tt('settings.gitInlineBlame')}</div>
                        <div className="settings-row-desc">{tt('settings.gitInlineBlame.desc')}</div>
                      </div>
                    </div>
                    <div className="settings-row-control">
                      <Switch value={s.gitInlineBlame} onLabel={tt('on')} offLabel={tt('off')} onChange={gitInlineBlame => updateSettings({ gitInlineBlame })} />
                    </div>
                  </div>
                  <hr className="settings-divider" />

                  <div className="settings-row">
                    <div className="settings-row-label">
                      <div>
                        <div className="settings-row-name">{tt('settings.trimTrailingWhitespace')}</div>
                        <div className="settings-row-desc">{tt('settings.trimTrailingWhitespace.desc')}</div>
                      </div>
                    </div>
                    <div className="settings-row-control">
                      <Switch value={s.trimTrailingWhitespace} onLabel={tt('on')} offLabel={tt('off')} onChange={trimTrailingWhitespace => updateSettings({ trimTrailingWhitespace })} />
                    </div>
                  </div>
                  <hr className="settings-divider" />

                  <div className="settings-row">
                    <div className="settings-row-label">
                      <div>
                        <div className="settings-row-name">{tt('settings.insertSpaces')}</div>
                        <div className="settings-row-desc">{tt('settings.insertSpaces.desc')}</div>
                      </div>
                    </div>
                    <div className="settings-row-control">
                      <Switch value={s.insertSpaces} onLabel={tt('on')} offLabel={tt('off')} onChange={insertSpaces => updateSettings({ insertSpaces })} />
                    </div>
                  </div>
                </div>


  );
}
