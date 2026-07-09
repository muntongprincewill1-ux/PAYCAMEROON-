import { useState, useEffect } from 'react';

export function useSettings() {
  const [appLogoUrl, setAppLogoUrl] = useState<string>('');

  useEffect(() => {
    fetch('/api/settings/public')
      .then(res => res.json())
      .then(data => {
        if (data.appLogoUrl) {
          setAppLogoUrl(data.appLogoUrl);
        }
      })
      .catch(err => console.error(err));
  }, []);

  return { appLogoUrl };
}
