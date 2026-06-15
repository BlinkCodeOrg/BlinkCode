export type InitialFileTemplate = {
  name: string;
  type: 'file' | 'folder';
  isExpanded?: boolean;
  language?: string;
  content?: string;
  children?: InitialFileTemplate[];
};
