import { useEffect, useState } from 'react';
import { fetchRawFileBlob } from '../../utils/api';

export function useAuthenticatedFileUrl(serverPath: string) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = '';
    setUrl('');
    setError(false);

    void fetchRawFileBlob(serverPath, controller.signal)
      .then((blob) => {
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch((loadError) => {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') return;
        setError(true);
      });

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [serverPath]);

  return { error, loading: !url && !error, url };
}
