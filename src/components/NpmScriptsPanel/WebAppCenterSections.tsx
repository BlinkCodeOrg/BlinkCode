import type React from 'react';
import { AlertTriangle, Bot, CheckCircle2, GitBranch, Globe, LayoutTemplate, MonitorPlay, Play, Square, TerminalSquare } from 'lucide-react';
import type { TerminalInstance } from '../../types';
import type { DiagnosticItem } from '../../features/problems/problemTypes';
import { PROJECT_TEMPLATES } from '../../features/projectTemplates/projectTemplates';
import type { GitFileEntry, GitStatusResponse, NpmScriptPackage, RestClientHistoryEntry, WebWorkflowAnalysis } from '../../utils/api';
import type { WebAppFirstRunChecklistState } from './useWebAppFirstRunChecklist';

type TFn = (key: string) => string;

function isRunning(terminal?: TerminalInstance | null) {
  return terminal?.status === 'starting' || terminal?.status === 'running';
}

function findTerminal(terminals: TerminalInstance[], packageDirectory: string, scriptName: string) {
  return terminals.find(item => item.scriptKey === `${packageDirectory}:${scriptName}`) || null;
}

export function OverviewSection({
  tt,
  workflow,
  packages,
  primaryPackage,
  problems,
  totalGitChanges,
  gitStatus,
  restHistory,
  previewBehavior,
  compact,
  guided,
  checklist,
  terminalInstances,
  suggestedUrl,
  onOpenPreview,
  onRunScript,
  onStopScript,
  onOpenProblems,
  onOpenSourceControl,
  onOpenProblem,
  onOpenDiff,
  onOpenRest,
}: {
  tt: TFn;
  workflow: WebWorkflowAnalysis | null;
  packages: NpmScriptPackage[];
  primaryPackage: NpmScriptPackage | WebWorkflowAnalysis['packages'][number] | null;
  problems: { counts: { errors: number; warnings: number; infos: number }; items: DiagnosticItem[] };
  totalGitChanges: number;
  gitStatus: GitStatusResponse | null;
  restHistory: RestClientHistoryEntry[];
  previewBehavior: string;
  compact: boolean;
  guided: boolean;
  checklist: WebAppFirstRunChecklistState;
  terminalInstances: TerminalInstance[];
  suggestedUrl: string | null;
  onOpenPreview: () => void;
  onRunScript: (npmPackage: NpmScriptPackage, scriptName: string) => void;
  onStopScript: (terminalId: string) => void;
  onOpenProblems: () => void;
  onOpenSourceControl: () => void;
  onOpenProblem: (item: DiagnosticItem) => void;
  onOpenDiff: (item: GitFileEntry, staged: boolean) => void;
  onOpenRest: () => void;
}) {
  const mainPackage = primaryPackage;
  const projectMeta = [
    mainPackage?.packageManager,
    workflow?.devServerScripts.length ? `${workflow.devServerScripts.length} ${tt('webCenter.devServers')}` : null,
    suggestedUrl,
  ].filter(Boolean).join(' / ');

  return (
    <div className="web-center-scroll">
      <section className="web-center-hero">
        <div>
          <h3>{workflow?.workspaceName || tt('npmScripts.workspace')}</h3>
          {!compact && <p title={projectMeta || tt('webCenter.detectHint')}>{projectMeta || tt('webCenter.detectHint')}</p>}
        </div>
        <button className="web-center-primary" onClick={onOpenPreview}>
          <MonitorPlay size={14} /> {tt('webCenter.preview')}
        </button>
      </section>

      {guided && (
        <section className="web-center-section">
          <div className="web-center-section-head">
            <h4>{tt('webCenter.checklist')}</h4>
            <span>{previewBehavior === 'auto-open' ? 'auto' : previewBehavior === 'never' ? 'off' : 'ask'}</span>
          </div>
          <div className="web-center-checklist">
            <ChecklistItem done={checklist.detectPackage} label={tt('webCenter.check.detectPackage')} />
            <ChecklistItem done={checklist.findDevScript} label={tt('webCenter.check.findDev')} />
            <ChecklistItem done={checklist.openPreview} label={tt('webCenter.check.openPreview')} />
            <ChecklistItem done={checklist.checkErrors} label={tt('webCenter.check.errors')} />
          </div>
        </section>
      )}

      <section className="web-center-metrics">
        <Metric icon={TerminalSquare} label={tt('webCenter.scripts')} value={packages.reduce((sum, item) => sum + item.scripts.length, 0)} />
        <Metric icon={AlertTriangle} label={tt('webCenter.problems')} value={problems.counts.errors + problems.counts.warnings} tone={problems.counts.errors ? 'bad' : problems.counts.warnings ? 'warn' : 'good'} />
        <Metric icon={GitBranch} label={tt('webCenter.changes')} value={totalGitChanges} />
        <Metric icon={Globe} label={tt('webCenter.rest')} value={workflow?.restFiles.length || 0} />
      </section>

      <DevServerSummary tt={tt} workflow={workflow} packages={packages} terminals={terminalInstances} onOpenPreview={onOpenPreview} onRun={onRunScript} onStop={onStopScript} />
      <SummaryBlock title={tt('webCenter.problems')} action={tt('common.open')} onAction={onOpenProblems}>
        <ProblemSummary tt={tt} problems={problems} onOpen={onOpenProblem} />
      </SummaryBlock>
      <SummaryBlock title={tt('webCenter.git')} action={tt('webCenter.sourceControl')} onAction={onOpenSourceControl}>
        <GitSummary tt={tt} status={gitStatus} onDiff={onOpenDiff} />
      </SummaryBlock>
      {!compact && <SummaryBlock title={tt('webCenter.restApi')} action={tt('webCenter.openRest')} onAction={onOpenRest}>
        <RestHistory tt={tt} restHistory={restHistory} onOpenRest={onOpenRest} />
      </SummaryBlock>}
    </div>
  );
}

function DevServerSummary({ tt, workflow, packages, terminals, onOpenPreview, onRun, onStop }: {
  tt: TFn;
  workflow: WebWorkflowAnalysis | null;
  packages: NpmScriptPackage[];
  terminals: TerminalInstance[];
  onOpenPreview: () => void;
  onRun: (npmPackage: NpmScriptPackage, scriptName: string) => void;
  onStop: (terminalId: string) => void;
}) {
  return (
      <SummaryBlock title={tt('webCenter.devServers')} action={tt('common.open')} onAction={onOpenPreview}>
      {workflow?.devServerScripts.slice(0, 4).map(script => {
        const npmPackage = packages.find(item => item.directory === script.packageDirectory);
        const terminal = findTerminal(terminals, script.packageDirectory, script.scriptName);
        const running = isRunning(terminal);
        return (
          <div className={`web-center-action-row web-center-script-row ${running ? 'is-running' : ''}`} key={`${script.packageDirectory}:${script.scriptName}`}>
            <div>
              <strong><span className={`web-center-script-dot ${running ? 'running' : ''}`} />{script.scriptName}</strong>
              <span>{script.packageName} / {script.packageManager} / {script.command}</span>
            </div>
            {running
              ? <button onClick={() => terminal && onStop(terminal.id)}><Square size={13} /></button>
              : <button onClick={() => npmPackage && onRun(npmPackage, script.scriptName)}><Play size={13} /></button>}
          </div>
        );
      })}
      {!workflow?.devServerScripts.length && <p className="web-center-muted">{tt('webCenter.noDevScripts')}</p>}
    </SummaryBlock>
  );
}

export function TemplatesSection({ tt, onOpenTemplates }: { tt: TFn; onOpenTemplates: (templateId?: string) => void }) {
  return (
    <div className="web-center-scroll">
      <SummaryBlock title={tt('webCenter.templates')} action={tt('common.create')} onAction={onOpenTemplates} icon={<LayoutTemplate size={13} />}>
        <div className="web-center-template-grid">
          {PROJECT_TEMPLATES.map(template => (
            <button key={template.id} className="web-center-template-card" onClick={() => onOpenTemplates(template.id)}>
              <LayoutTemplate size={16} />
              <strong>{template.name}</strong>
              <span>{tt(template.descriptionKey)}</span>
            </button>
          ))}
        </div>
      </SummaryBlock>
    </div>
  );
}

function SummaryBlock({ title, action, onAction, icon, children }: { title: string; action: string; onAction: () => void; icon?: React.ReactNode; children: React.ReactNode }) {
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

function RestHistory({ tt, restHistory, onOpenRest }: { tt: TFn; restHistory: RestClientHistoryEntry[]; onOpenRest: () => void }) {
  const [latestRequest] = restHistory;

  const getTone = (status: number) => {
    if (status >= 500) return 'bad';
    if (status >= 400) return 'warn';
    if (status >= 200) return 'good';
    return '';
  };

  return (
    <div className="web-center-list">
      {latestRequest && (
        <div className="web-center-rest-summary">
          <Globe size={13} />
          <span>{tt('webCenter.lastRequest')}</span>
          <strong className={`web-center-rest-status ${getTone(latestRequest.status)}`}>{latestRequest.status}</strong>
          <small>{latestRequest.durationMs}ms</small>
        </div>
      )}
      {restHistory.slice(0, 5).map(item => (
        <button key={item.id} onClick={onOpenRest}>
          <Globe size={13} />
          <span>
            <b>{item.method}</b>
            <em className={`web-center-rest-status ${getTone(item.status)}`}>{item.status}</em>
          </span>
          <small>{item.url}</small>
        </button>
      ))}
      {restHistory.length === 0 && <p className="web-center-muted">{tt('webCenter.noRecentRequests')}</p>}
    </div>
  );
}

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return <div className={done ? 'done' : ''}><CheckCircle2 size={13} /><span>{label}</span></div>;
}

function Metric({ icon: Icon, label, value, tone }: { icon: typeof Bot; label: string; value: number; tone?: 'good' | 'warn' | 'bad' }) {
  return <div className={`web-center-metric ${tone || ''}`}><Icon size={15} /><strong>{value}</strong><span>{label}</span></div>;
}

function ProblemSummary({ tt, problems, onOpen }: { tt: TFn; problems: { counts: { errors: number; warnings: number; infos: number }; items: DiagnosticItem[] }; onOpen: (item: DiagnosticItem) => void }) {
  const total = problems.counts.errors + problems.counts.warnings;
  if (problems.items.length === 0) {
    return (
      <div className="web-center-empty-good">
        <CheckCircle2 size={14} />
        <span>{tt('webCenter.noProblems')}</span>
      </div>
    );
  }
  return (
    <div className="web-center-list">
      <div className="web-center-branch"><AlertTriangle size={13} /> {problems.counts.errors} / {problems.counts.warnings}</div>
      {problems.items.map((item, index) => (
        <button key={`${item.relPath}:${item.startLineNumber}:${index}`} onClick={() => onOpen(item)}>
          <AlertTriangle size={13} />
          <span>{item.relPath}:{item.startLineNumber}</span>
          <small>{item.message}</small>
        </button>
      ))}
      {total > problems.items.length && <p className="web-center-muted">+{total - problems.items.length}</p>}
    </div>
  );
}

function GitSummary({ tt, status, onDiff }: { tt: TFn; status: GitStatusResponse | null; onDiff: (item: GitFileEntry, staged: boolean) => void }) {
  if (!status?.isRepo) return <p className="web-center-muted">{tt('webCenter.noGit')}</p>;
  const totals = {
    staged: status.staged.length,
    unstaged: status.unstaged.length,
    untracked: status.untracked.length,
    conflicts: status.conflicts.length,
  };
  const changes = [...status.conflicts.map(item => ({ item, staged: false })), ...status.unstaged.map(item => ({ item, staged: false })), ...status.staged.map(item => ({ item, staged: true })), ...status.untracked.map(item => ({ item, staged: false }))].slice(0, 5);
  const hidden = totals.conflicts + totals.unstaged + totals.staged + totals.untracked - changes.length;
  return (
    <div className="web-center-list">
      <div className="web-center-branch"><GitBranch size={13} /> {status.branch || 'detached'} {tt('webCenter.branch')}</div>
      <div className="web-center-git-stats">
        <span><strong>{totals.staged}</strong>{tt('webCenter.staged')}</span>
        <span><strong>{totals.unstaged}</strong>{tt('webCenter.unstaged')}</span>
        <span><strong>{totals.untracked}</strong>{tt('webCenter.untracked')}</span>
        <span className={totals.conflicts ? 'bad' : ''}><strong>{totals.conflicts}</strong>{tt('webCenter.conflicts')}</span>
      </div>
      {changes.length === 0 && <p className="web-center-muted">{tt('webCenter.cleanTree')}</p>}
      {changes.map(({ item, staged }) => (
        <button key={`${staged}:${item.path}`} onClick={() => onDiff(item, staged)}>
          <GitBranch size={13} />
          <span>{item.status}</span>
          <small>{item.path}</small>
        </button>
      ))}
      {hidden > 0 && <p className="web-center-muted">+{hidden}</p>}
    </div>
  );
}
