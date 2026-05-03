import { useEffect, useState } from 'react';

type ApiClient = {
  on: (...args: any[]) => () => void;
};

type SendCommand = (command: string, params?: Record<string, unknown>) => void;

type UseSettingsLogicParams = {
  api: ApiClient | null;
  sendCommand: SendCommand;
};

export function useSettingsLogic({ api, sendCommand }: UseSettingsLogicParams) {
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false);
  const [wifiEnabled, setWifiEnabled] = useState(true);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  

  useEffect(() => {
    if (!api) return;

    const unsubscribe = api.on('response', (msg) => {
      setResponseTime(msg.payload?.timestamp ? Date.now() - msg.payload.timestamp : null);
    });

    return () => unsubscribe();
  }, [api]);

  const handleBluetoothToggle = (value: boolean) => {
    setBluetoothEnabled(value);
    sendCommand('toggle_bluetooth', { enabled: value });
  };

  const handleWifiToggle = (value: boolean) => {
    setWifiEnabled(value);
    sendCommand('toggle_wifi', { enabled: value });
  };

  const handleClearCache = () => {
    sendCommand('clear_cache', {});
  };

  const handleRestartServer = () => {
    sendCommand('restart_server', {});
  };

  return {
    bluetoothEnabled,
    wifiEnabled,
    responseTime,
    handleBluetoothToggle,
    handleWifiToggle,
    handleClearCache,
    handleRestartServer,
  };
}
