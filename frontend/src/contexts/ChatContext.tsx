import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { getSocket } from '../utils/socket';
import { useUser } from '../hooks/useUser';

export type ChatMessage = {
  id: string;
  roomId: string; // e.g. listing:123
  listingId: number;
  message: string;
  senderId: string;
  createdAt: string; // ISO
  clientMsgId?: string | null;
};

export type Conversation = {
  listingId: number;
  messages: ChatMessage[];
  unreadCount: number;
  lastAt: string | null;
};

type ChatContextType = {
  conversations: Record<number, Conversation>;
  addMessage: (msg: ChatMessage) => void;
  markRead: (listingId: number) => void;
  hydrateConversation: (listingId: number, messages: ChatMessage[]) => void;
  clear: () => void;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

function storageKey(userId?: string | number) {
  return `bizbook_chat_conversations_${userId || 'anon'}`;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [conversations, setConversations] = useState<Record<number, Conversation>>({});
  const [seenClientMsgIds, setSeenClientMsgIds] = useState<Set<string>>(new Set());

  // Cookie helpers
  const cookiePrefix = useMemo(() => `bizchat_${user?.id || 'anon'}_listing_`, [user?.id]);
  const setCookie = useCallback((name: string, value: string, days = 30) => {
    try {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      const expires = `; expires=${date.toUTCString()}`;
      document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Lax`;
    } catch {}
  }, []);
  const getCookie = useCallback((name: string) => {
    try {
      const nameEQ = name + '=';
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
      }
    } catch {}
    return null;
  }, []);

  // Load from cookies (per-listing cookie)
  useEffect(() => {
    try {
      const all = document.cookie.split(';').map(s => s.trim());
      const convs: Record<number, Conversation> = {};
      for (const pair of all) {
        if (!pair.startsWith(cookiePrefix)) continue;
        const [k, v] = pair.split('=');
        if (!k || v === undefined) continue;
        const suffix = k.replace(cookiePrefix, '');
        const listingId = parseInt(suffix);
        if (!listingId) continue;
        const json = getCookie(cookiePrefix + listingId);
        if (!json) continue;
        try {
          const data = JSON.parse(json);
          if (Array.isArray(data?.messages)) {
            convs[listingId] = {
              listingId,
              messages: data.messages,
              unreadCount: 0,
              lastAt: data.messages.length ? data.messages[data.messages.length - 1].createdAt : null
            };
          }
        } catch {}
      }
      setConversations(convs);
    } catch {}
  }, [cookiePrefix, getCookie]);

  // One-time migration: push cookie messages to server and then hydrate from server
  useEffect(() => {
    let cancelled = false;
    const migrate = async () => {
      try {
        const base = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001';
        const entries = Object.values(conversations);
        for (const conv of entries) {
          const listingId = conv.listingId;
          // Skip if we have nothing or already migrated flag in localStorage
          if (!conv.messages?.length) continue;
          const key = `chat_migrated_${user?.id || 'anon'}_${listingId}`;
          if (localStorage.getItem(key) === '1') continue;

          // Get or create conversation id by listing
          const byListing = await fetch(`${base}/api/chat/by-listing/${listingId}`);
          if (!byListing.ok) continue;
          const { conversation } = await byListing.json();
          if (!conversation?.id) continue;

          // Prepare import payload: only messages that have clientMsgId
          const payload = conv.messages
            .filter(m => m.clientMsgId && m.message)
            .map(m => ({
              client_msg_id: m.clientMsgId,
              text: m.message,
              sender_role: (String(m.senderId) === 'vendor') ? 'vendor' : 'shopper',
              created_at: m.createdAt,
            }));
          if (payload.length) {
            try {
              await fetch(`${base}/api/chat/by-listing/${listingId}/import`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: payload })
              });
            } catch (_) {}
          }

          // Hydrate from server to replace cookie state
          try {
            const msgsRes = await fetch(`${base}/api/chat/${conversation.id}/messages?limit=50`);
            if (msgsRes.ok) {
              const data = await msgsRes.json();
              const roomId = `listing:${listingId}`;
              const mapped = Array.isArray(data?.messages) ? data.messages.map((m: any) => ({
                id: String(m.id),
                roomId,
                listingId,
                message: String(m.text || ''),
                senderId: String(m.sender_role || ''),
                createdAt: m.created_at || new Date().toISOString(),
                clientMsgId: m.client_msg_id || null,
              })) : [];
              if (!cancelled) {
                hydrateConversation(listingId, mapped);
              }
            }
          } catch (_) {}

          // Mark as migrated to avoid repeats
          localStorage.setItem(key, '1');
        }
      } catch {}
    };
    migrate();
    return () => { cancelled = true; };
  }, [conversations, user?.id]);

  // Persist to cookies (cap messages to avoid cookie size limits)
  useEffect(() => {
    try {
      const MAX_PER_CONV = 10; // keep last 10 messages to fit cookie limits
      Object.values(conversations).forEach(conv => {
        const compact = {
          messages: conv.messages.slice(-MAX_PER_CONV)
        };
        const value = JSON.stringify(compact);
        // Skip if too large: rough guard ~3000 chars
        const safe = value.length > 3000 ? JSON.stringify({ messages: compact.messages.slice(-5) }) : value;
        setCookie(cookiePrefix + conv.listingId, safe, 30);
      });
    } catch {}
  }, [conversations, cookiePrefix, setCookie]);

  // Wire socket listeners once
  useEffect(() => {
    const socket = getSocket();

    const onNew = (msg: any) => {
      const roomId: string | undefined = msg?.roomId;
      if (!roomId || !roomId.startsWith('listing:')) return;
      const listingIdStr = roomId.split(':')[1];
      const listingId = parseInt(listingIdStr);
      if (!listingId) return;

      // Deduplicate by clientMsgId if present
      const clientMsgId: string | undefined = msg?.clientMsgId || undefined;
      if (clientMsgId) {
        if (seenClientMsgIds.has(clientMsgId)) return;
        setSeenClientMsgIds(prev => new Set(prev).add(clientMsgId));
      }

      const chatMsg: ChatMessage = {
        id: msg.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        roomId,
        listingId,
        message: String(msg.message || ''),
        senderId: String(msg.senderId || 'anonymous'),
        createdAt: msg.createdAt || new Date().toISOString(),
        clientMsgId: clientMsgId || null
      };
      addMessage(chatMsg);
    };

    const onAck = (ack: any) => {
      try {
        const clientMsgId = ack?.clientMsgId;
        const messageId = ack?.messageId;
        const serverTimestamp = ack?.serverTimestamp;
        if (!clientMsgId) return;
        setConversations(prev => {
          const next = { ...prev } as Record<number, Conversation>;
          for (const [lidStr, conv] of Object.entries(prev)) {
            const listingId = Number(lidStr);
            const idx = conv.messages.findIndex(m => m.clientMsgId && m.clientMsgId === clientMsgId);
            if (idx >= 0) {
              const updated = { ...conv.messages[idx] } as ChatMessage;
              if (messageId) updated.id = String(messageId);
              if (serverTimestamp) updated.createdAt = serverTimestamp;
              const newMsgs = conv.messages.slice();
              newMsgs[idx] = updated;
              next[listingId] = {
                ...conv,
                messages: newMsgs,
                lastAt: newMsgs[newMsgs.length - 1]?.createdAt || conv.lastAt,
              };
              break;
            }
          }
          return next;
        });
      } catch {}
    };

    socket.on('message:new', onNew);
    socket.on('message:ack', onAck);
    return () => {
      socket.off('message:new', onNew);
      socket.off('message:ack', onAck);
    };
  }, []);

  const addMessage = useCallback((msg: ChatMessage) => {
    setConversations(prev => {
      const existing = prev[msg.listingId] || { listingId: msg.listingId, messages: [], unreadCount: 0, lastAt: null };
      // Dedupe by clientMsgId or server id
      const isDuplicate = existing.messages.some(m => (msg.clientMsgId && m.clientMsgId && m.clientMsgId === msg.clientMsgId) || (m.id && msg.id && m.id === msg.id));
      if (isDuplicate) return prev;
      const next: Conversation = {
        listingId: existing.listingId,
        messages: [...existing.messages, msg],
        unreadCount: existing.unreadCount + 1,
        lastAt: msg.createdAt
      };
      return { ...prev, [msg.listingId]: next };
    });
    // Mark clientMsgId as seen to prevent future duplicates
    if (msg.clientMsgId) {
      setSeenClientMsgIds(prev => new Set(prev).add(msg.clientMsgId as string));
    }
  }, []);

  const markRead = useCallback((listingId: number) => {
    setConversations(prev => {
      const existing = prev[listingId];
      if (!existing) return prev;
      return { ...prev, [listingId]: { ...existing, unreadCount: 0 } };
    });
  }, []);

  const hydrateConversation = useCallback((listingId: number, messages: ChatMessage[]) => {
    setConversations(prev => {
      const sorted = [...messages].sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
      const lastAt = sorted.length ? sorted[sorted.length - 1].createdAt : null;
      return {
        ...prev,
        [listingId]: {
          listingId,
          messages: sorted,
          unreadCount: 0,
          lastAt
        }
      };
    });
    // Seed seenClientMsgIds to avoid duplicates on re-hydration
    try {
      const ids = messages.map(m => m.clientMsgId).filter(Boolean) as string[];
      if (ids.length) setSeenClientMsgIds(prev => {
        const next = new Set(prev);
        ids.forEach(id => next.add(id));
        return next;
      });
    } catch {}
  }, []);

  const clear = useCallback(() => setConversations({}), []);

  const value = useMemo(() => ({ conversations, addMessage, markRead, hydrateConversation, clear }), [conversations, addMessage, markRead, hydrateConversation, clear]);
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    // Fallback to prevent runtime crashes if provider is not yet mounted
    return {
      conversations: {},
      addMessage: () => {},
      markRead: () => {},
      hydrateConversation: () => {},
      clear: () => {}
    } as unknown as ChatContextType;
  }
  return ctx;
}
