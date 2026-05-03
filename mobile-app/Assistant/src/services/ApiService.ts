type EventType = 'status' | 'response' | 'error';

interface StatusPayload {
  connected: boolean;
  host?: string;
  port?: number;
}

interface ResponsePayload {
  timestamp?: number;
  [key: string]: unknown;
}

interface ApiMessage {
  payload?: StatusPayload & ResponsePayload;
}

type EventCallback = (msg: ApiMessage) => void;

interface ConnectionStatus {
  connected: boolean;
}

class ApiService {
  private listeners: Map<EventType, Set<EventCallback>> = new Map();
  private connected: boolean = false;

  on(event: EventType, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  getConnectionStatus(): ConnectionStatus {
    return { connected: this.connected };
  }

  private emit(event: EventType, msg: ApiMessage): void {
    this.listeners.get(event)?.forEach((cb) => cb(msg));
  }

  sendCommand(command: string): void {
    console.log('Sending command:', command);
    this.emit('response', { payload: { connected: this.connected, timestamp: Date.now() } });
  }

  setConnected(value: boolean): void {
    this.connected = value;
    this.emit('status', { payload: { connected: value } });
  }
}

let instance: ApiService | null = null;

export function getApiService(): ApiService {
  if (!instance) {
    instance = new ApiService();
  }
  return instance;
}
