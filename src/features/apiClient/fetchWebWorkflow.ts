import { API } from './apiBase';
import { request } from './request';
import type { WebWorkflowAnalysis } from './webWorkflowTypes';

export function fetchWebWorkflow(): Promise<WebWorkflowAnalysis> {
  return request(`${API}/web-workflow`);
}
