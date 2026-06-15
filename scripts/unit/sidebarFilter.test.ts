import assert from 'node:assert/strict';
import test from 'node:test';
import { filterSidebarNode } from '../../src/components/Sidebar/filterSidebarNode';
import type { FileNode } from '../../src/types';

test('Explorer excludes extension detail and other virtual nodes', () => {
  const extensionNode: FileNode = {
    id: 'extension-detail:demo.extension',
    name: 'Demo Extension',
    type: 'file',
    virtual: true,
    extensionDetail: {} as FileNode['extensionDetail'],
  };
  assert.equal(filterSidebarNode(extensionNode, ''), false);
  assert.equal(filterSidebarNode({ id: 'readme', name: 'README.md', type: 'file', serverPath: 'README.md' }, ''), true);
});
