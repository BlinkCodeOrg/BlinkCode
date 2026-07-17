import { useEffect, useState } from 'react';

export function useAppVersion(fallback = '-') {
  const [version, setVersion] = useState(fallback);

  useEffect(() => {
    let active = true;
    void window.electronAPI
      ?.getAppVersion?.()
      .then((installedVersion) => {
        if (active && installedVersion) setVersion(installedVersion);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  return version;
}
