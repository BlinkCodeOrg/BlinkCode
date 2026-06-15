import { ARCHIVE_EXTENSIONS } from './archiveExtensions';
import { DOCUMENT_EXTENSIONS } from './documentExtensions';
import type { FileSupportKind, FileSupportMode } from './fileSupportTypes';
import { FONT_EXTENSIONS } from './fontExtensions';
import { GENERATED_FILE_NAMES } from './generatedFileNames';
import { getExtension } from './getExtension';
import { IMAGE_EXTENSIONS } from './imageExtensions';
import { isSupportedWebFile } from './isSupportedWebFile';
import { isBinaryBlockedFile } from './isBinaryBlockedFile';
import { LARGE_FILE_LIMIT } from './largeFileLimit';
import { MEDIA_EXTENSIONS } from './mediaExtensions';
import { normalizeFileName } from './normalizeFileName';

export function getDetailedFileSupportInfo(fileName: string, options?: { binary?: boolean; size?: number }) {
  const normalized = normalizeFileName(fileName);
  const extension = getExtension(normalized);
  const size = options?.size ?? 0;
  const binary = !!options?.binary;

  if (size > LARGE_FILE_LIMIT) {
    return {
      supported: false,
      mode: 'readonly' as FileSupportMode,
      kind: 'large' as FileSupportKind,
      badge: 'large file',
      messageKey: 'preview.largeFile',
    };
  }

  if (GENERATED_FILE_NAMES.has(normalized)) {
    return {
      supported: true,
      mode: 'readonly' as FileSupportMode,
      kind: 'generated' as FileSupportKind,
      badge: 'generated',
      messageKey: 'preview.generatedFile',
    };
  }

  if (isSupportedWebFile(fileName)) {
    return {
      supported: true,
      mode: 'editable' as FileSupportMode,
      kind: extension === 'json' || extension === 'yaml' || extension === 'yml' || extension === 'toml' ? 'config' as FileSupportKind : 'code' as FileSupportKind,
      badge: undefined,
      messageKey: undefined,
    };
  }

  if (IMAGE_EXTENSIONS.has(extension)) {
    return {
      supported: false,
      mode: extension === 'svg' ? 'readonly' as FileSupportMode : 'preview' as FileSupportMode,
      kind: 'image' as FileSupportKind,
      badge: extension === 'svg' ? 'read-only' : 'preview',
      messageKey: extension === 'svg' ? 'preview.readOnlyTextFile' : 'preview.imagePreview',
    };
  }

  if (ARCHIVE_EXTENSIONS.has(extension)) {
    return {
      supported: false,
      mode: 'blocked' as FileSupportMode,
      kind: 'archive' as FileSupportKind,
      badge: 'archive',
      messageKey: 'preview.archiveFile',
    };
  }

  if (FONT_EXTENSIONS.has(extension)) {
    return {
      supported: false,
      mode: 'blocked' as FileSupportMode,
      kind: 'font' as FileSupportKind,
      badge: 'font',
      messageKey: 'preview.fontFile',
    };
  }

  if (DOCUMENT_EXTENSIONS.has(extension)) {
    return {
      supported: false,
      mode: 'blocked' as FileSupportMode,
      kind: 'document' as FileSupportKind,
      badge: 'document',
      messageKey: 'preview.documentFile',
    };
  }

  if (MEDIA_EXTENSIONS.has(extension)) {
    return {
      supported: false,
      mode: 'blocked' as FileSupportMode,
      kind: 'media' as FileSupportKind,
      badge: 'media',
      messageKey: 'preview.mediaFile',
    };
  }

  if (binary || isBinaryBlockedFile(fileName)) {
    return {
      supported: false,
      mode: 'blocked' as FileSupportMode,
      kind: 'binary' as FileSupportKind,
      badge: 'binary',
      messageKey: 'preview.binaryBlocked',
    };
  }

  return {
    supported: false,
    mode: 'readonly' as FileSupportMode,
    kind: 'unknown' as FileSupportKind,
    badge: 'read-only',
    messageKey: 'preview.readOnlyTextFile',
  };
}
