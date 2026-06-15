export interface RestClientRequest {
  index: number;
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string | null;
}

export interface RestClientResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  truncated: boolean;
  durationMs: number;
  size: number;
}

export interface RestClientHistoryEntry {
  id: number;
  method: string;
  url: string;
  status: number;
  durationMs: number;
  createdAt: number;
}
