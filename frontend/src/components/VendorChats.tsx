import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useUser } from '../hooks/useUser';
import { getSocket } from '../utils/socket';
import { FiSearch } from 'react-icons/fi';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Card from './ui/Card';
import Button from './ui/Button';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const VendorChats: React.FC = () => {
  const { conversations, markRead, addMessage, hydrateConversation } = useChat();
  const { apiRequest } = useUser();
  const [products, setProducts] = useState<any[]>([]);
  const [selectedListingId, setSelectedListingId] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typing, setTyping] = useState<{ [listingId: number]: boolean }>({});
  const query = useQuery();
  const navigate = useNavigate();

  // Load vendor products for mapping listingId -> product info
  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiRequest('/api/vendor/products?limit=1000');
        const arr = Array.isArray(data?.products) ? data.products : Array.isArray(data) ? data : [];
        setProducts(arr);
      } catch (e) {
        console.warn('Failed to load vendor products for chats', e);
      }
    };
    load();
  }, [apiRequest]);

  // Preselect listing from URL if provided
  useEffect(() => {
    const listing = query.get('listing');
    if (listing) setSelectedListingId(parseInt(listing));
  }, [query]);

  // Ensure we join rooms for all vendor listings for real-time updates
  useEffect(() => {
    const socket = getSocket();
    (products || []).forEach((p) => {
      if (p?.id) socket.emit('joinRoom', { roomId: `listing:${p.id}` });
    });

    const onTyping = (payload: any) => {
      const roomId = payload?.roomId as string;
      if (!roomId || !roomId.startsWith('listing:')) return;
      const listingId = parseInt(roomId.split(':')[1]);
      if (!listingId) return;
      const fromVendor = String(payload?.senderId) === 'vendor';
      if (fromVendor) return; // don't show typing for myself
      setTyping(prev => ({ ...prev, [listingId]: !!payload?.typing }));
    };

    socket.on('typing', onTyping);
    return () => { socket.off('typing', onTyping); };
  }, [products]);

  const convList = useMemo(() => {
    const entries = Object.values(conversations);
    const withProduct = entries.map((c) => ({
      ...c,
      product: products.find((p) => p.id === c.listingId) || null
    }));
    const filtered = withProduct.filter((item) => {
      if (!searchTerm) return true;
      const name = item.product?.name || '';
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    });
    return filtered.sort((a, b) => (b.lastAt || '').localeCompare(a.lastAt || ''));
  }, [conversations, products, searchTerm]);

  const productThumb = useCallback((p: any): string | null => {
    if (!p) return null;
    return p.cover_image || p.image_url || (Array.isArray(p.images) && p.images[0]?.image_url) || null;
  }, []);

  const fmtTime = useCallback((iso?: string | null) => {
    try {
      if (!iso) return '';
      const d = new Date(iso);
      return d.toLocaleString();
    } catch { return ''; }
  }, []);

  const selectedConversation = useMemo(() => {
    if (!selectedListingId) return null;
    return convList.find((c) => c.listingId === selectedListingId) || null;
  }, [convList, selectedListingId]);

  // Track hydration/read to avoid repeated calls per listing
  const hydratedOnceRef = useRef<Set<number>>(new Set());
  const markedReadOnceRef = useRef<Set<number>>(new Set());

  // Mark selected conversation as read and hydrate from server when opened (run once per listingId)
  useEffect(() => {
    (async () => {
      if (!selectedListingId) return;
      if (hydratedOnceRef.current.has(selectedListingId)) return;
      try {
        // Fetch conversation id by listing
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/chat/by-listing/${selectedListingId}`);
        if (!res.ok) return;
        const { conversation } = await res.json();
        if (!conversation?.id) return;
        const msgsRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/chat/${conversation.id}/messages?limit=50`);
        if (!msgsRes.ok) return;
        const data = await msgsRes.json();
        const roomId = `listing:${selectedListingId}`;
        const mapped = Array.isArray(data?.messages) ? data.messages.map((m: any) => ({
          id: String(m.id),
          roomId,
          listingId: selectedListingId,
          message: String(m.text || ''),
          senderId: String(m.sender_role || ''),
          createdAt: m.created_at || new Date().toISOString(),
          clientMsgId: m.client_msg_id || null,
        })) : [];
        hydrateConversation(selectedListingId, mapped);
        hydratedOnceRef.current.add(selectedListingId);
        markRead(selectedListingId);
        // Mark read on server for vendor role (only once per listing selection)
        if (!markedReadOnceRef.current.has(selectedListingId)) {
          try {
            await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/chat/${conversation.id}/read?role=vendor`, {
              method: 'POST',
              headers: { 'X-CSRF-Token': 'disabled' }
            });
            markedReadOnceRef.current.add(selectedListingId);
          } catch (_) {}
        }
      } catch (e) {
        console.warn('Failed to hydrate vendor chat', e);
      }
    })();
  }, [selectedListingId, hydrateConversation, markRead]);

  const productForSelected = useMemo(() => {
    return products.find((p) => p.id === selectedListingId) || null;
  }, [products, selectedListingId]);

  const sendMessage = useCallback(() => {
    const msg = input.trim();
    if (!msg || !selectedListingId) return;
    const socket = getSocket();
    const clientMsgId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    socket.emit('joinRoom', { roomId: `listing:${selectedListingId}` }); // ensure joined
    socket.emit('message:send', { roomId: `listing:${selectedListingId}`, message: msg, senderId: 'vendor', clientMsgId });
    // Optimistic add (with clientMsgId for dedupe)
    try {
      addMessage({
        id: clientMsgId,
        clientMsgId,
        roomId: `listing:${selectedListingId}`,
        listingId: selectedListingId,
        message: msg,
        senderId: 'vendor',
        createdAt: new Date().toISOString(),
      } as any);
    } catch {}
    setInput('');
    // stop typing when sending
    socket.emit('typing', { roomId: `listing:${selectedListingId}`, senderId: 'vendor', typing: false });
  }, [input, selectedListingId, addMessage]);

  // Sound + desktop notification helpers
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      try { Notification.requestPermission(); } catch {}
    }
  }, []);

  const playBeep = useCallback(() => {
    try {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(880, ctx.currentTime);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.25);
      setTimeout(() => ctx.close(), 500);
    } catch {}
  }, []);

  // Notify on new messages for other conversations or when hidden
  useEffect(() => {
    const socket = getSocket();
    const handler = (msg: any) => {
      const roomId = msg?.roomId as string;
      if (!roomId || !roomId.startsWith('listing:')) return;
      const listingId = parseInt(roomId.split(':')[1]);
      const mine = String(msg?.senderId) === 'vendor';
      if (mine) return;
      const isActiveConv = listingId && listingId === selectedListingId;
      const hidden = document.visibilityState === 'hidden';
      if (!isActiveConv || hidden) {
        playBeep();
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            const product = products.find(p => p.id === listingId);
            const n = new Notification(product?.name || 'New message', {
              body: msg?.message || 'New message received',
            });
            n.onclick = () => {
              window.focus();
              setSelectedListingId(listingId);
            };
          } catch {}
        }
      }
    };
    socket.on('message:new', handler);
    return () => { socket.off('message:new', handler); };
  }, [selectedListingId, products, playBeep]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  // Auto-scroll to latest on selection or new messages
  useEffect(() => {
    try {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    } catch {}
  }, [selectedListingId, selectedConversation?.messages?.length]);

  // Layout — clean, minimal, balanced whitespace
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-1">Conversations with shoppers by product</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar: Conversations */}
          <Card className="p-0 overflow-hidden lg:col-span-1">
            <div className="border-b border-gray-100 p-4">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="w-full pl-10 pr-3 py-2 rounded-md border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {convList.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">No conversations yet.</div>
              ) : (
                convList.map((c) => (
                  <button
                    key={c.listingId}
                    onClick={() => setSelectedListingId(c.listingId)}
                    className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${selectedListingId === c.listingId ? 'bg-gray-50' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {productThumb(c.product) ? (
                        <img
                          src={productThumb(c.product) as string}
                          alt={c.product?.name || `Listing #${c.listingId}`}
                          className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                          onError={(e: any) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xl">📦</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium text-gray-900 truncate">{c.product?.name || `Listing #${c.listingId}`}</div>
                          {c.unreadCount > 0 && (
                            <span className="shrink-0 inline-flex items-center justify-center text-[11px] font-semibold text-white bg-blue-600 rounded-full h-5 min-w-[1.25rem] px-1">
                              {c.unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-[12px] text-gray-600 truncate">
                          {c.messages[c.messages.length - 1]?.message || '—'}
                        </div>
                        <div className="mt-1 text-[11px] text-gray-400">
                          {fmtTime(c.lastAt)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>

          {/* Main: Conversation */}
          <Card className="lg:col-span-2 p-0 overflow-hidden">
            {selectedListingId ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-3 min-w-0">
                    {productThumb(productForSelected) ? (
                      <img
                        src={productThumb(productForSelected) as string}
                        alt={productForSelected?.name || `Listing #${selectedListingId}`}
                        className="w-10 h-10 rounded-md object-cover border border-gray-200"
                        onError={(e: any) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-lg">🛍️</div>
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{productForSelected?.name || `Listing #${selectedListingId}`}</div>
                      {productForSelected?.price ? (
                        <div className="text-xs text-gray-500">₦{Number(productForSelected.price || 0).toLocaleString()}</div>
                      ) : null}
                    </div>
                  </div>
                  <Link to={`/product/${selectedListingId}`} className="text-sm text-blue-600 hover:text-blue-700">View listing</Link>
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="h-[540px] overflow-y-auto p-4 bg-white">
                  {typing[selectedListingId!] && (
                    <div className="mb-3 text-xs text-gray-500">Shopper is typing…</div>
                  )}
                  {selectedConversation?.messages?.length ? (
                    <div className="space-y-3">
                      {selectedConversation.messages.map((m, idx) => {
                        const mine = m.senderId === 'vendor';
                        return (
                          <div key={m.id || idx} className={`flex items-end gap-2 ${mine ? 'justify-end flex-row-reverse' : 'justify-start'}`}>
                            <div className={`w-8 h-8 rounded-full ${mine ? 'bg-blue-600' : 'bg-gray-300'} text-white flex items-center justify-center text-xs select-none`}>{mine ? 'You' : 'S'}</div>
                            <div className={`${mine ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'} max-w-[75%] rounded-2xl px-4 py-2 shadow-sm`}
                              title={new Date(m.createdAt).toLocaleString()}>
                              <div className="text-[10px] mb-1 opacity-80">{mine ? 'You' : 'Shopper'}</div>
                          <div className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{m.message}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500 text-sm">No messages in this conversation yet.</div>
                  )}
                </div>

                {/* Composer */}
                <div className="p-4 border-t border-gray-100 bg-white/90 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <input
                      className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                      placeholder={selectedListingId ? "Type a message…" : "Select a conversation to start"}
                      disabled={!selectedListingId}
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        const socket = getSocket();
                        if (selectedListingId) {
                          socket.emit('typing', { roomId: `listing:${selectedListingId}`, senderId: 'vendor', typing: true });
                          // stop typing after 1.5s of inactivity
                          window.clearTimeout((window as any).__typingTimer);
                          (window as any).__typingTimer = window.setTimeout(() => {
                            socket.emit('typing', { roomId: `listing:${selectedListingId}`, senderId: 'vendor', typing: false });
                          }, 1500);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          sendMessage();
                          const socket = getSocket();
                          if (selectedListingId) socket.emit('typing', { roomId: `listing:${selectedListingId}`, senderId: 'vendor', typing: false });
                        }
                      }}
                    />
                    <Button onClick={() => {
                      sendMessage();
                      const socket = getSocket();
                      if (selectedListingId) socket.emit('typing', { roomId: `listing:${selectedListingId}`, senderId: 'vendor', typing: false });
                    }} className="rounded-full px-5">
                      Send
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-[560px] flex items-center justify-center text-gray-500 text-sm">
                Select a conversation to begin.
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VendorChats;
