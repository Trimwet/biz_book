import React from 'react';
import { X } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export default function FilterDrawer({ open, onClose, title = 'Filters', children }: Props) {
  return (
    <div className={open ? 'fixed inset-0 z-40' : 'hidden'}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-[88%] max-w-sm bg-white shadow-xl rounded-l-2xl p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-neutral-900">{title}</h3>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center hover:bg-neutral-800 transition-colors duration-200 shadow-sm"
            aria-label="Close filters"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
