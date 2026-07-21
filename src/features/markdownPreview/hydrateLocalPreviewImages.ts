import { authenticatedFetch } from '../apiClient/apiSession';

export function hydrateLocalPreviewImages(root: HTMLElement): () => void {
  const controller = new AbortController();
  const objectUrls = new Set<string>();

  for (const image of root.querySelectorAll<HTMLImageElement>('img[src^="/api/raw?"]')) {
    const source = image.getAttribute('src');
    if (!source) continue;
    void authenticatedFetch(source, { cache: 'no-store', signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Cannot load Markdown image (${response.status})`);
        return response.blob();
      })
      .then((blob) => {
        if (controller.signal.aborted) return;
        const objectUrl = URL.createObjectURL(blob);
        objectUrls.add(objectUrl);
        image.src = objectUrl;
      })
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          image.dataset.previewError = 'true';
        }
      });
  }

  return () => {
    controller.abort();
    for (const objectUrl of objectUrls) URL.revokeObjectURL(objectUrl);
  };
}
