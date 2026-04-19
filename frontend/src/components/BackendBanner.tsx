import React, { useEffect, useState } from 'react';
import config from '../config';

export default function BackendBanner() {
  const [down, setDown] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const check = async () => {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch(`${config.API_BASE_URL}/health`, { signal: ctrl.signal });
      clearTimeout(t);
      setDown(!res.ok);
      setLastChecked(new Date());
    } catch (_) {
      setDown(true);
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    check();
    const onFocus = () => check();
    const timer = setInterval(check, 20000);
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onFocus);
    };
  }, []);

  if (!down) return null;
  return (
    <div className="w-full bg-red-50 border-b border-red-200 text-red-800">
      <div className="max-w-7xl mx-auto px-4 py-2 text-sm flex items-center justify-between">
        <div>
          The backend API is not reachable. Some data may not load. Retrying...
          {lastChecked && <span className="ml-2 text-red-600/80">Checked {lastChecked.toLocaleTimeString()}</span>}
        </div>
        <button onClick={check} className="px-3 py-1 rounded bg-red-600 text-white text-xs hover:bg-red-700">Retry now</button>
      </div>
    </div>
  );
}