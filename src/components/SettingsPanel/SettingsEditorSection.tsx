import type { EditorSettings } from '../../types';
import { SettingsNumberStepper } from './SettingsNumberStepper';
import { SettingsRow } from './SettingsRow';
import { Select } from '../ui/Select';
import { Switch } from '../ui/Switch';

interface SettingsEditorSectionProps {
  s: EditorSettings;
  tt: (key: string) => string;
  updateSettings: (settings: Partial<EditorSettings>) => void;
}

export default function SettingsEditorSection({
  s,
  tt,
  updateSettings,
}: SettingsEditorSectionProps) {
  const toggle = (value: boolean, onChange: (value: boolean) => void) => (
    <Switch value={value} onLabel={tt('on')} offLabel={tt('off')} onChange={onChange} />
  );

  return (
    <div className="settings-section">
      <div className="settings-section-title">{tt('settings.editor')}</div>
      <div className="settings-section-desc">{tt('settings.editor.desc')}</div>

      <SettingsRow name={tt('settings.fontSize')} description={tt('settings.fontSize.desc')}>
        <SettingsNumberStepper min={10} max={28} value={s.fontSize} onChange={fontSize => updateSettings({ fontSize })} />
      </SettingsRow>

      <SettingsRow name={tt('settings.tabSize')} description={tt('settings.tabSize.desc')}>
        <Select
          ariaLabel={tt('settings.tabSize')}
          options={[2, 4, 8].map(value => ({ value, label: String(value) }))}
          value={s.tabSize}
          onChange={value => updateSettings({ tabSize: value as number })}
        />
      </SettingsRow>

      <SettingsRow name={tt('settings.wordWrap')} description={tt('settings.wordWrap.desc')}>
        {toggle(s.wordWrap, wordWrap => updateSettings({ wordWrap }))}
      </SettingsRow>

      <SettingsRow name={tt('settings.minimap')} description={tt('settings.minimap.desc')}>
        {toggle(s.minimap, minimap => updateSettings({ minimap }))}
      </SettingsRow>

      <SettingsRow name={tt('settings.stickyScroll')} description={tt('settings.stickyScroll.desc')}>
        {toggle(s.stickyScroll, stickyScroll => updateSettings({ stickyScroll }))}
      </SettingsRow>

      <SettingsRow name={tt('settings.fontLigatures')} description={tt('settings.fontLigatures.desc')}>
        {toggle(s.fontLigatures, fontLigatures => updateSettings({ fontLigatures }))}
      </SettingsRow>

      <SettingsRow name={tt('settings.lineNumbers')} description={tt('settings.lineNumbers.desc')}>
        {toggle(s.lineNumbers, lineNumbers => updateSettings({ lineNumbers }))}
      </SettingsRow>

      <SettingsRow name={tt('settings.cursorBlinking')} description={tt('settings.cursorBlinking.desc')}>
        <Select
          ariaLabel={tt('settings.cursorBlinking')}
          options={['smooth', 'blink', 'phase', 'expand', 'solid'].map(value => ({ value, label: value }))}
          value={s.cursorBlinking}
          onChange={value => updateSettings({ cursorBlinking: value as EditorSettings['cursorBlinking'] })}
        />
      </SettingsRow>

      <SettingsRow name={tt('settings.fontFamily')} description={tt('settings.fontFamily.desc')}>
        <Select
          ariaLabel={tt('settings.fontFamily')}
          options={['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'Source Code Pro', 'monospace'].map(value => ({
            value,
            label: tt('fontFamily.' + value.toLowerCase().replace(/ /g, '-')),
          }))}
          value={s.fontFamily}
          onChange={value => updateSettings({ fontFamily: value as string })}
        />
      </SettingsRow>

      <SettingsRow name={tt('settings.cursorStyle')} description={tt('settings.cursorStyle.desc')}>
        <Select
          ariaLabel={tt('settings.cursorStyle')}
          options={['line', 'block', 'underline', 'line-thin', 'block-outline'].map(value => ({ value, label: tt('cursorStyle.' + value) }))}
          value={s.cursorStyle}
          onChange={value => updateSettings({ cursorStyle: value as EditorSettings['cursorStyle'] })}
        />
      </SettingsRow>

      <SettingsRow name={tt('settings.renderWhitespace')} description={tt('settings.renderWhitespace.desc')}>
        <Select
          ariaLabel={tt('settings.renderWhitespace')}
          options={['none', 'boundary', 'all'].map(value => ({ value, label: tt('renderWhitespace.' + value) }))}
          value={s.renderWhitespace}
          onChange={value => updateSettings({ renderWhitespace: value as EditorSettings['renderWhitespace'] })}
        />
      </SettingsRow>

      <SettingsRow name={tt('settings.autoClosingBrackets')} description={tt('settings.autoClosingBrackets.desc')}>
        {toggle(s.autoClosingBrackets, autoClosingBrackets => updateSettings({ autoClosingBrackets }))}
      </SettingsRow>

      <SettingsRow name="Tailwind IntelliSense" description="Autocomplete, hover previews and invalid utility warnings.">
        {toggle(s.tailwindTooling, tailwindTooling => updateSettings({ tailwindTooling }))}
      </SettingsRow>

      <SettingsRow name="Tailwind class sorting" description="Expose the Tailwind class sorting editor action.">
        {toggle(s.tailwindClassSorting, tailwindClassSorting => updateSettings({ tailwindClassSorting }))}
      </SettingsRow>

      <SettingsRow name="AI inline completions" description="Show cancellable AI ghost-text suggestions in Monaco.">
        {toggle(s.aiInlineCompletions, aiInlineCompletions => updateSettings({ aiInlineCompletions }))}
      </SettingsRow>
    </div>
  );
}
