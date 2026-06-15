import { API } from './apiBase';
import { request } from './request';

export interface EditorConfigProperties {
  indent_style?: 'space' | 'tab';
  indent_size?: string;
  tab_width?: string;
  end_of_line?: 'lf' | 'crlf' | 'cr';
  trim_trailing_whitespace?: 'true' | 'false';
  insert_final_newline?: 'true' | 'false';
}

export async function fetchEditorConfig(serverPath: string): Promise<EditorConfigProperties> {
  return request(`${API}/editor-config?path=${encodeURIComponent(serverPath)}`);
}
