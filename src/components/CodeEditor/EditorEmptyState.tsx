import { Files, FolderOpen, LayoutTemplate, Settings2, Workflow } from 'lucide-react';
import { getMainShortcuts } from '../../features/editorEmpty/getMainShortcuts';
import BlinkLogo from '../common/BlinkLogo';
import DotGrid from '../common/DotGrid';
import { OnboardingSection } from './OnboardingSection';
import { Checkbox } from '../ui/Checkbox';

type EditorEmptyStateProps = {
  isSolid: boolean;
  dotGridColor: string;
  showOnboarding: boolean;
  dontShowAgain: boolean;
  tt: (key: string) => string;
  onDismissOnboarding: () => void;
  onDontShowAgainChange: (value: boolean) => void;
  onOpenFolder: () => void;
  onOpenTemplates: () => void;
};

export function EditorEmptyState({
  isSolid,
  dotGridColor,
  showOnboarding,
  dontShowAgain,
  tt,
  onDismissOnboarding,
  onDontShowAgainChange,
  onOpenFolder,
  onOpenTemplates,
}: EditorEmptyStateProps) {
  const mainShortcuts = getMainShortcuts(tt);

  return (
    <div className={`editor-empty${isSolid ? ' editor-empty-solid' : ''}`}>
      {isSolid ? (
        <div className="shortcuts-overlay">
          <div className="shortcuts-grid">
            {mainShortcuts.map(shortcut => (
              <div key={shortcut.keys} className="shortcut-item">
                <kbd className="shortcut-keys">{shortcut.keys}</kbd>
                <span className="shortcut-label">{shortcut.label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <DotGrid color={dotGridColor} />
      )}

      {!isSolid && !showOnboarding && (
        <div className="empty-inner">
          <div className="empty-icon">
            <BlinkLogo className="empty-logo" />
          </div>
          <p className="empty-welcome">
            {tt('empty.welcome').replace('BlinkCode', '').replace('blinkcode', '')}
            <span className="blink-blue">Blink</span>Code
          </p>
          <div className="empty-actions">
            <button type="button" className="empty-action empty-action-primary" onClick={onOpenFolder}>
              <FolderOpen size={15} />
              {tt('openFolder')}
            </button>
            <button type="button" className="empty-action" onClick={onOpenTemplates}>
              <LayoutTemplate size={15} />
              {tt('project.create')}
            </button>
          </div>
        </div>
      )}

      {showOnboarding && (
        <div className="onboarding-overlay">
          <div className="onboarding-window">
            <header className="onboarding-hero">
              <div className="onboarding-logo-wrap">
                <BlinkLogo className="onboarding-logo" />
              </div>
              <div className="onboarding-heading">
                <span className="onboarding-kicker">BlinkCode</span>
                <h2 className="onboarding-title">{tt('onboarding.title')}</h2>
                <p className="onboarding-text">{tt('onboarding.description')}</p>
              </div>
            </header>

            <div className="onboarding-sections">
              <OnboardingSection
                icon={FolderOpen}
                title={tt('onboarding.section.start')}
                items={[
                  tt('onboarding.item.openFolder'),
                  tt('onboarding.item.projectTree'),
                  tt('onboarding.item.editFiles'),
                ]}
              />
              <OnboardingSection
                icon={Files}
                title={tt('onboarding.section.files')}
                items={[
                  tt('onboarding.item.supportedFiles'),
                  tt('onboarding.item.unsupported'),
                  tt('onboarding.item.tabs'),
                ]}
              />
              <OnboardingSection
                icon={Settings2}
                title={tt('onboarding.section.interface')}
                items={[
                  tt('onboarding.item.sidebar'),
                  tt('onboarding.item.settings'),
                  tt('onboarding.item.ai'),
                ]}
              />
              <OnboardingSection
                icon={Workflow}
                title={tt('onboarding.section.workflow')}
                items={[
                  tt('onboarding.item.autosave'),
                  tt('onboarding.item.restore'),
                  tt('onboarding.item.shortcuts'),
                ]}
              />
            </div>

            <footer className="onboarding-footer">
              <Checkbox checked={dontShowAgain} className="onboarding-checkbox" onChange={onDontShowAgainChange}>
                {tt('onboarding.dontShowAgain')}
              </Checkbox>
              <button type="button" className="onboarding-primary-action" onClick={onDismissOnboarding}>
                {tt('onboarding.startWorking')}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
