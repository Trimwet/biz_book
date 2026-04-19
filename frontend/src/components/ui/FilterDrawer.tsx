import React from 'react';

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
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="h-8 px-3 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}
