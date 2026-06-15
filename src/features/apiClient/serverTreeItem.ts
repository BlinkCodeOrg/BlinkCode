export interface ServerTreeItem {
  name: string;
  type: 'file' | 'folder';
  path: string;
  size?: number;
  children?: ServerTreeItem[];
}
