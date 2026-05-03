import { useState, useEffect } from 'react';
import { getApiService } from '../services/ApiService';

interface ApiStatus {
  host: string;
  port: number;
  connected: boolean;
}

export function useApi() {
  const api = getApiService();
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<ApiStatus | null>(null);

  useEffect(() => {
    const current = api.getConnectionStatus();
    setIsConnected(current.connected);

    const unsubscribe = api.on('status', (msg) => {
      const connected = msg.payload?.connected ?? false;
      setIsConnected(connected);
      if (connected) {
        setStatus({
          host: (msg.payload?.host as string) ?? 'localhost',
          port: (msg.payload?.port as number) ?? 8080,
          connected: true,
        });
      } else {
        setStatus(null);
      }
    });

    return () => unsubscribe();
  }, [api]);

  const sendCommand = (command: string, params: Record<string, unknown> = {}) => {
    console.log('sendCommand:', command, params);
    api.sendCommand(command);
  };

  return { api, isConnected, status, sendCommand };
}
