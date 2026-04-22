import { useEffect, useRef, useState, useCallback } from 'react';

export interface RankNotification {
  id: string;
  type: 'rank_up' | 'rank_down';
  username: string;
  score: number;
  newRank: number;
  timestamp: number;
}

export function useWebSocket(token: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<RankNotification[]>([]);

  useEffect(() => {
    if (!token) return;

    const url = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.event === 'rank_change') {
          const notification: RankNotification = {
            id: crypto.randomUUID(),
            type: 'rank_up',
            username: msg.data.username ?? '某玩家',
            score: msg.data.score,
            newRank: msg.data.newRank,
            timestamp: Date.now(),
          };
          setNotifications((prev) => [notification, ...prev].slice(0, 10));
        }
      } catch {
        // ignore malformed messages
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [token]);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  return { connected, notifications, dismiss, clearAll };
}
