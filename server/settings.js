import fs from 'fs';
import os from 'os';
import path from 'path';

const userDataDir = path.join(
  process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
  'BlinkCode',
);

const settingsDirectory = process.env.BLINKCODE_STORAGE_DIR
  ? path.resolve(process.env.BLINKCODE_STORAGE_DIR)
  : userDataDir;
const GLOBAL_SETTINGS_PATH = path.join(settingsDirectory, 'settings.json');

fs.mkdirSync(settingsDirectory, { recursive: true });

const defaultSettings = {
  autoUpdate: true,
  fontSize: 13,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  autoSaveDelay: 1000,
  fontLigatures: true,
  lineNumbers: true,
  cursorBlinking: 'smooth',
  fontFamily: 'JetBrains Mono',
  cursorStyle: 'line',
  renderWhitespace: 'none',
  bracketPairColorization: true,
  autoClosingBrackets: true,
  smoothScrolling: true,
  tailwindTooling: true,
  tailwindClassSorting: true,
  aiInlineCompletions: true,
  envMaskSecrets: true,
  spellChecker: false,
  snippets: [],
  importedTheme: null,
  trimTrailingWhitespace: false,
  insertFinalNewline: true,
  insertSpaces: true,
  animations: true,
  showFileIcons: true,
  compactMode: false,
  dotGridColor: '#4f8cff',
  language: 'en',
  colorScheme: 'dark',
  theme: 'one-dark',
};

function readJsonFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return {};
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return {};
  }
}

function writeJsonFile(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

export function getGlobalSettingsPath() {
  return GLOBAL_SETTINGS_PATH;
}

export function getWorkspaceSettingsPath(workspaceDir) {
  if (!workspaceDir) return null;
  return path.join(workspaceDir, '.blinkcode', 'settings.json');
}

export function loadGlobalSettings() {
  return readJsonFile(GLOBAL_SETTINGS_PATH);
}

export function loadWorkspaceSettings(workspaceDir) {
  const p = getWorkspaceSettingsPath(workspaceDir);
  if (!p) return {};
  return readJsonFile(p);
}

export function loadMergedSettings(workspaceDir) {
  const global = loadGlobalSettings();
  const workspace = loadWorkspaceSettings(workspaceDir);
  return { ...defaultSettings, ...global, ...workspace };
}

export function saveGlobalSettings(settings) {
  writeJsonFile(GLOBAL_SETTINGS_PATH, settings);
}

export function saveWorkspaceSettingsFile(workspaceDir, settings) {
  const p = getWorkspaceSettingsPath(workspaceDir);
  if (!p) return;
  writeJsonFile(p, settings);
}

export function loadGlobalSettingsRaw() {
  try {
    if (!fs.existsSync(GLOBAL_SETTINGS_PATH)) return '{\n}\n';
    return fs.readFileSync(GLOBAL_SETTINGS_PATH, 'utf-8');
  } catch {
    return '{\n}\n';
  }
}

export function saveGlobalSettingsRaw(content) {
  fs.mkdirSync(path.dirname(GLOBAL_SETTINGS_PATH), { recursive: true });
  fs.writeFileSync(GLOBAL_SETTINGS_PATH, content, 'utf-8');
}

export function loadWorkspaceSettingsRaw(workspaceDir) {
  const p = getWorkspaceSettingsPath(workspaceDir);
  if (!p) return '{\n}\n';
  try {
    if (!fs.existsSync(p)) return '{\n}\n';
    return fs.readFileSync(p, 'utf-8');
  } catch {
    return '{\n}\n';
  }
}

export function saveWorkspaceSettingsRaw(workspaceDir, content) {
  const p = getWorkspaceSettingsPath(workspaceDir);
  if (!p) return;
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, 'utf-8');
}

export { defaultSettings };
