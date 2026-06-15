import assert from 'node:assert/strict';
import test from 'node:test';
import { getSchemaDefinition } from '../../src/features/schemaTooling/schemaDefinitions';
import { validateJsonSchema } from '../../src/features/schemaTooling/validateJsonSchema';
import { validateYamlDocument } from '../../src/features/schemaTooling/validateYamlDocument';

test('selects schemas for common project configuration files', () => {
  assert(getSchemaDefinition('/workspace/package.json')?.keys.includes('dependencies'));
  assert(getSchemaDefinition('/workspace/tsconfig.build.json')?.keys.includes('compilerOptions'));
  assert(getSchemaDefinition('/workspace/.github/workflows/ci.yml')?.keys.includes('jobs'));
  assert(getSchemaDefinition('/workspace/docker-compose.yaml')?.keys.includes('services'));
});

test('validates required JSON and YAML keys plus YAML structure', () => {
  const packageSchema = getSchemaDefinition('package.json');
  assert.match(validateJsonSchema('{"private":true}', packageSchema)[0].message, /name/);

  const workflowSchema = getSchemaDefinition('.github/workflows/ci.yml');
  const diagnostics = validateYamlDocument('name: CI\nname: duplicate\n jobs:\n\tbuild:', workflowSchema);
  assert(diagnostics.some(item => item.message.includes('Duplicate')));
  assert(diagnostics.some(item => item.message.includes('two-space')));
  assert(diagnostics.some(item => item.message.includes('tabs')));
  assert(diagnostics.some(item => item.message.includes('"on"')));
});
