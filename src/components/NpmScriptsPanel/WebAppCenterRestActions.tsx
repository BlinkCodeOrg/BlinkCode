import { Braces, FileCode2, Globe } from 'lucide-react';
import type { WebWorkflowAnalysis } from '../../utils/api';

type TFn = (key: string) => string;

export function RestActions({ tt, workflow, onCreateHttp, onOpenRest, onCreateEnv }: { tt: TFn; workflow: WebWorkflowAnalysis | null; onCreateHttp: () => void; onOpenRest: () => void; onCreateEnv: () => void }) {
  const restCount = workflow?.restFiles.length || 0;
  const envCount = workflow?.envFiles.length || 0;
  return (
    <section className="web-center-rest">
      <button onClick={onCreateHttp}><FileCode2 size={13} /> {tt('webCenter.createHttp')}</button>
      <button onClick={onOpenRest}><Globe size={13} /> {restCount ? `${tt('webCenter.openRest')} (${restCount})` : tt('webCenter.openRest')}</button>
      <button onClick={onCreateEnv}><Braces size={13} /> {envCount ? `Env (${envCount})` : tt('webCenter.envHelper')}</button>
    </section>
  );
}
