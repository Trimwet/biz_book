import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';

// Lightweight Command Palette (Cmd/Ctrl + K)
// - Opens anywhere in the app
// - Type to search; Enter navigates to /search?query=...
// - Minimal visual noise; Apple-like calm styling

const DEFAULT_SUGGESTIONS = [
  'Electronics',
  'Phones',
  'Laptops',
  'Appliances',
  'Fashion',
  'Accessories',
  'Generators',
  'TV & Audio',
];

export default function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  // Open with Cmd/Ctrl + K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DEFAULT_SUGGESTIONS;
    return DEFAULT_SUGGESTIONS.filter((s) => s.toLowerCase().includes(q)).slice(0, 8);
  }, [query]);

  const go = (value?: string) => {
    const q = (value ?? query).trim();
    if (q.length === 0) return;
    setOpen(false);
    setQuery('');
    navigate(`/search?query=${encodeURIComponent(q)}`);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="absolute left-1/2 top-24 -translate-x-1/2 w-[90%] max-w-xl rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3">
          <Search size={18} className="text-gray-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') go(); }}
            placeholder="Search products, vendors, categories…"
            className="flex-1 outline-none text-sm text-gray-900 placeholder-gray-400"
          />
          <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
        <div className="border-t border-gray-100">
          {list.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">No suggestions</div>
          ) : (
            <ul className="py-2 max-h-64 overflow-auto">
              {list.map((item) => (
                <li key={item}>
                  <button
                    onClick={() => go(item)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-200">
          <span className="text-xs text-gray-500">Type to search • Enter to go • Esc to close</span>
          <span className="text-[10px] text-gray-400">⌘/Ctrl + K</span>
        </div>
      </div>
    </div>
  );
}
