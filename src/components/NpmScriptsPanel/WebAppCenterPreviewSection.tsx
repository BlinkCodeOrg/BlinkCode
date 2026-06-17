import type React from 'react';
import { MonitorPlay, Play, RefreshCw } from 'lucide-react';
import type { NpmScriptPackage, WebWorkflowAnalysis } from '../../utils/api';

type TFn = (key: string) => string;

export function PreviewSection({ tt, workflow, packages, suggestedUrl, browserUrl, browserOpen, browserLoading, browserError, onOpenPreview, onRefresh, onRunScript }: {
  tt: TFn;
  workflow: WebWorkflowAnalysis | null;
  packages: NpmScriptPackage[];
  suggestedUrl: string | null;
  browserUrl: string | null;
  browserOpen: boolean;
  browserLoading: boolean;
  browserError: string | null;
  onOpenPreview: () => void;
  onRefresh: () => void;
  onRunScript: (npmPackage: NpmScriptPackage, scriptName: string) => void;
}) {
  const previewUrl = suggestedUrl || browserUrl;
  const hasDevScripts = Boolean(workflow?.devServerScripts.length);
  const previewState = previewUrl
    ? (browserOpen ? tt('webCenter.previewOpen') : tt('webCenter.previewClosed'))
    : hasDevScripts ? tt('webCenter.noLocalUrl') : tt('webCenter.noDevScripts');
  return (
    <div className="web-center-scroll">
      <SummaryBlock title={tt('webCenter.previewControl')} action={tt('webCenter.openPreview')} onAction={onOpenPreview} icon={<MonitorPlay size={13} />}>
        <div className={`web-center-preview-card ${previewUrl ? 'has-url' : 'missing-url'}`}>
          <MonitorPlay size={24} />
          <strong title={previewUrl || previewState}>{previewUrl || tt('webCenter.noUrl')}</strong>
          <span>{previewState} / {browserLoading ? tt('webCenter.loading') : tt('webCenter.idle')}</span>
          {browserError && <p>{browserError}</p>}
        </div>
      </SummaryBlock>
      <SummaryBlock title={tt('webCenter.detectedDevScripts')} action={tt('common.refresh')} onAction={onRefresh} icon={<RefreshCw size={13} />}>
        {workflow?.devServerScripts.map(script => (
          <div className="web-center-action-row" key={`${script.packageDirectory}:${script.scriptName}`}>
            <div>
              <strong>{script.packageName}: {script.scriptName}</strong>
              <span>{script.command}</span>
            </div>
            <button onClick={() => {
              const npmPackage = packages.find(item => item.directory === script.packageDirectory);
              if (npmPackage) onRunScript(npmPackage, script.scriptName);
            }}><Play size={13} /></button>
          </div>
        ))}
        {!workflow?.devServerScripts.length && <p className="web-center-muted">{tt('webCenter.noDevScripts')}</p>}
      </SummaryBlock>
    </div>
  );
}

function SummaryBlock({ title, action, onAction, icon, children }: { title: string; action: string; onAction: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="web-center-section">
      <div className="web-center-section-head">
        <h4>{title}</h4>
        <button onClick={onAction}>{icon}{action}</button>
      </div>
      {children}
    </section>
  );
}
