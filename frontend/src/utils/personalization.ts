import config from '../config';
import { postEvent } from '../api/personalization';

const lastViewSent: Record<number, number> = {};

export function sendViewEventOnce(productId: number, metadata?: any, windowMs = 30000) {
  const now = Date.now();
  const last = lastViewSent[productId] || 0;
  if (now - last < windowMs) return;
  lastViewSent[productId] = now;
  // Fire and forget; do not block UI
  postEvent(config.API_BASE_URL, { type: 'view_item', productId, metadata }).catch(() => {});
}