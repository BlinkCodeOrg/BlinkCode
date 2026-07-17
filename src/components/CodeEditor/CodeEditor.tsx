import Editor from '@monaco-editor/react';
import { useEditor } from '../../store/EditorContext';
import { isImageFile, getRawFileUrl } from '../../utils/api';
import { FileWarning } from 'lucide-react';
import { useT } from '../../hooks/useT';
import {
  getDetailedFileSupportInfo,
  getFileSupportInfo,
  getMonacoLanguage,
} from '../../utils/supportedWebFiles';
import DiffPreview from './DiffPreview';
import { getMonacoTheme } from '../../features/editorTheme/getMonacoTheme';
import { useGitInlineDecorations } from '../../features/gitInline/useGitInlineDecorations';
import { useImagePreviewState } from '../../features/imagePreview/useImagePreviewState';
import { isSettingsFile } from '../../features/editorFiles/isSettingsFile';
import { isUnsupportedTextFile as getIsUnsupportedTextFile } from '../../features/editorFiles/isUnsupportedTextFile';
import { useGitInlineBlame } from '../../features/editorBlame/useGitInlineBlame';
import { useEditorOnboarding } from '../../features/editorOnboarding/useEditorOnboarding';
import { useMonacoEditorLifecycle } from '../../features/editorMonaco/useMonacoEditorLifecycle';
import { useSafeEditorChange } from '../../features/editorMonaco/useSafeEditorChange';
import { EditorBlame } from './EditorBlame';
import { EditorEmptyState } from './EditorEmptyState';
import { ImagePreview } from './ImagePreview';
import { MarkdownPreviewTab } from './MarkdownPreviewTab';
import { LargeFilePreview } from './LargeFilePreview';
import { LARGE_FILE_LIMIT } from '../../features/fileSupport/largeFileLimit';
import { useCodeEditorBackground } from '../../features/editorSettings/useCodeEditorBackground';
import RestClientBar from '../RestClient/RestClientBar';
import { ExtensionDetailTab } from '../ExtensionsPanel/ExtensionDetailTab';
import { useOpenWorkspaceFolder } from '../../features/topHeader/useOpenWorkspaceFolder';
import './CodeEditor.css';

export default function CodeEditor({
  group = 'primary',
}: {
  group?: 'primary' | 'secondary';
}) {
  const {
    state,
    updateFileContent,
    getActiveFile,
    getSplitActiveFile,
    registerEditor,
    dispatch,
    addToast,
  } = useEditor();
  const getFileForGroup =
    group === 'primary' ? getActiveFile : getSplitActiveFile;
  const tt = useT();
  const activeFile = getFileForGroup();
  const supportInfo = activeFile
    ? getFileSupportInfo(activeFile.name)
    : { supported: true };
  const detailedSupport = activeFile
    ? getDetailedFileSupportInfo(activeFile.name, {
        binary: activeFile.binary,
        size: activeFile.size,
      })
    : null;
  const isSettingsJson = isSettingsFile(activeFile);
  const isUnsupportedTextFile = getIsUnsupportedTextFile(
    activeFile,
    supportInfo,
    isSettingsJson,
  );
  const blameInfo = useGitInlineBlame(
    activeFile,
    state.settings.gitInlineBlame,
  );
  const onboarding = useEditorOnboarding({ activeFile, dispatch });
  const imagePreview = useImagePreviewState(activeFile?.id);
  const monacoLifecycle = useMonacoEditorLifecycle({
    activeFile,
    group,
    registerEditor,
    settings: state.settings,
    workspaceDir: state.workspaceDir,
  });
  const handleChange = useSafeEditorChange({
    activeFile,
    editorRef: monacoLifecycle.editorRef,
    readOnly: isUnsupportedTextFile,
    updateFileContent,
  });

  useGitInlineDecorations(
    activeFile,
    monacoLifecycle.editorRef,
    monacoLifecycle.monacoRef,
  );

  const editorBackground = useCodeEditorBackground(state.settings);
  const handleOpenFolder = useOpenWorkspaceFolder();

  if (!activeFile) {
    return (
      <EditorEmptyState
        isSolid={editorBackground.isSolid}
        dotGridColor={state.settings.dotGridColor}
        showOnboarding={onboarding.showOnboarding}
        dontShowAgain={onboarding.dontShowAgain}
        tt={tt}
        onDismissOnboarding={onboarding.dismissOnboarding}
        onDontShowAgainChange={onboarding.setDontShowAgain}
        onOpenFolder={handleOpenFolder}
        onOpenTemplates={() =>
          window.dispatchEvent(
            new CustomEvent('blinkcode:openProjectTemplates'),
          )
        }
      />
    );
  }
  if (
    activeFile.binary &&
    isImageFile(activeFile.name) &&
    activeFile.serverPath
  ) {
    const src = getRawFileUrl(activeFile.serverPath);

    return (
      <ImagePreview
        previewRef={imagePreview.previewRef}
        src={src}
        zoom={imagePreview.zoom}
        pan={imagePreview.pan}
        isPanning={imagePreview.isPanning}
        imgError={imagePreview.imgError}
        tt={tt}
        onMouseDown={imagePreview.onMouseDown}
        onMouseMove={imagePreview.onMouseMove}
        onMouseUp={imagePreview.onMouseUp}
        onZoomIn={imagePreview.zoomIn}
        onZoomOut={imagePreview.zoomOut}
        onResetView={imagePreview.resetView}
        onImageError={imagePreview.onImageError}
      />
    );
  }
  if (activeFile.binary) {
    return (
      <div className="editor-preview">
        <div className="preview-error">
          <FileWarning size={32} />
          <span>{tt(detailedSupport?.messageKey || 'preview.binaryFile')}</span>
          {detailedSupport?.badge && (
            <span className="preview-badge">{detailedSupport.badge}</span>
          )}
        </div>
      </div>
    );
  }

  if (
    activeFile.diffOriginalContent !== undefined &&
    activeFile.diffModifiedContent !== undefined
  ) {
    return (
      <DiffPreview
        title={tt('sc.diffPreview')}
        serverPath={activeFile.serverPath}
        fallbackName={activeFile.name}
        original={activeFile.diffOriginalContent}
        modified={activeFile.diffModifiedContent}
        hunks={activeFile.diffHunks}
        fontSize={state.settings.fontSize}
        fontFamily={state.settings.fontFamily}
        theme={getMonacoTheme(state.settings.theme, state.settings.colorScheme)}
      />
    );
  }

  if (
    typeof activeFile.size === 'number' &&
    activeFile.size > LARGE_FILE_LIMIT
  ) {
    return (
      <LargeFilePreview
        file={activeFile}
        onUpdate={(content, offset, done) =>
          dispatch({
            type: 'SET_LARGE_FILE_PREVIEW',
            payload: { fileId: activeFile.id, content, offset, done },
          })
        }
      />
    );
  }

  if (activeFile.markdownPreviewContent !== undefined) {
    return (
      <MarkdownPreviewTab
        sourcePath={activeFile.markdownPreviewSourcePath}
        content={activeFile.markdownPreviewContent || ''}
        tt={tt}
      />
    );
  }
  if (activeFile.extensionDetail) {
    return <ExtensionDetailTab file={activeFile} />;
  }

  return (
    <div
      className={`code-editor ${editorBackground.hasBackground ? 'code-editor-with-background' : ''}`}
      style={editorBackground.style}
    >
      {activeFile.name.toLowerCase().endsWith('.http') && (
        <RestClientBar
          content={activeFile.content || ''}
          onError={(message) => addToast(message, 'error')}
        />
      )}
      {state.settings.gitInlineBlame && blameInfo && (
        <EditorBlame blameInfo={blameInfo} />
      )}
      {isUnsupportedTextFile && activeFile && (
        <div className="editor-notice" role="note">
          <div className="editor-notice-icon">
            <FileWarning size={18} />
          </div>
          <div className="editor-notice-body">
            <div className="editor-notice-title">
              {tt('preview.webOnlyTitle')}
            </div>
            <div className="editor-notice-text">
              {tt(detailedSupport?.messageKey || 'preview.webOnlyMessage', {
                file: activeFile.name,
              })}
            </div>
            <div className="editor-notice-text editor-notice-text-muted">
              {tt('preview.webOnlyDescription')}
            </div>
            <div className="editor-notice-meta">
              <span className="editor-notice-badge">
                {detailedSupport?.badge || tt('preview.readOnlyBadge')}
              </span>
            </div>
          </div>
        </div>
      )}
      <Editor
        height="100%"
        language={getMonacoLanguage(activeFile.name) || activeFile.language}
        path={activeFile.serverPath || activeFile.id}
        value={activeFile.content || ''}
        onChange={handleChange}
        onMount={monacoLifecycle.handleMount}
        theme={getMonacoTheme(state.settings.theme, state.settings.colorScheme)}
        loading={
          <div className="editor-loader-wrap">
            <div className="editor-loader" />
          </div>
        }
        options={{ readOnly: isUnsupportedTextFile }}
      />
    </div>
  );
}
