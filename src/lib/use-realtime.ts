"use client";

import { useEffect, useRef } from "react";

interface UseRealtimeOptions {
  channelId?: string;
  onEvent?: (event: { type: string; payload: any; senderId?: string }) => void;
  onMessage?: (event: { event?: string; data?: any; type?: string; payload?: any; [key: string]: any }) => void;
}

export function useRealtime({ channelId, onEvent, onMessage }: UseRealtimeOptions) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectTimeout: any = null;

    function connect() {
      const url = channelId
        ? `/api/realtime?channelId=${encodeURIComponent(channelId)}`
        : "/api/realtime";

      es = new EventSource(url);

      es.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (onEventRef.current) {
            onEventRef.current(parsed);
          }
          if (onMessageRef.current) {
            onMessageRef.current(parsed);
          }
        } catch {}
      };

      es.onerror = () => {
        if (es) {
          es.close();
        }
        // Exponential backoff reconnect
        reconnectTimeout = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (es) es.close();
    };
  }, [channelId]);
}
