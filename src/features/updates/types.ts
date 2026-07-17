export type UpdatePhase =
  | 'idle'
  | 'checking'
  | 'not-available'
  | 'available'
  | 'downloading'
  | 'download-error'
  | 'downloaded'
  | 'installing'
  | 'updated'
  | 'unsupported'
  | 'development';

export interface AvailableUpdate {
  version: string;
  releaseDate?: string;
  releaseName?: string;
  releaseNotes?: string;
}

export interface UpdateDownloadProgress {
  bytesPerSecond: number;
  percent: number;
  total: number;
  transferred: number;
}

export interface UpdateStatus {
  phase: UpdatePhase;
  availableUpdate: AvailableUpdate | null;
  downloadProgress: UpdateDownloadProgress | null;
  updateDownloaded: boolean;
  error: string | null;
  errorKey: string | null;
}

export type UpdateMockState =
  | 'available'
  | 'downloading'
  | 'download-error'
  | 'downloaded'
  | 'installing'
  | 'not-available';
