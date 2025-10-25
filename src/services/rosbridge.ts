import ROSLIB from 'roslib';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export class ROSBridgeService {
  private ros: ROSLIB.Ros | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private listeners = new Set<(status: ConnectionStatus) => void>();
  private url: string;

  constructor(defaultUrl: string = 'ws://10.131.58.62:9191') {
    let saved = defaultUrl;
    try {
      if (typeof window !== 'undefined') {
        const fromStorage = localStorage.getItem('rosbridge_url');
        if (fromStorage) saved = fromStorage;
      }
    } catch {}
    this.url = saved;
  }

  connect(onStatusChange?: (status: ConnectionStatus) => void) {
    if (onStatusChange) {
      this.listeners.add(onStatusChange);
    }

    this.notify('connecting');

    this.ros = new ROSLIB.Ros({ url: this.url });

    this.ros.on('connection', () => {
      console.log('Connected to ROSBridge');
      this.reconnectAttempts = 0;
      this.notify('connected');
    });

    this.ros.on('error', (error) => {
      console.error('ROSBridge error:', error);
      this.notify('error');
      this.attemptReconnect();
    });

    this.ros.on('close', () => {
      console.log('Connection to ROSBridge closed');
      this.notify('disconnected');
      this.attemptReconnect();
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.notify('error');
    }
  }

  private notify(status: ConnectionStatus) {
    this.listeners.forEach((cb) => {
      try { cb(status); } catch {}
    });
  }

  onStatusChange(callback: (status: ConnectionStatus) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  getUrl(): string {
    return this.url;
  }

  disconnect() {
    if (this.ros) {
      this.ros.close();
      this.ros = null;
    }
  }

  getRos(): ROSLIB.Ros | null {
    return this.ros;
  }

  isConnected(): boolean {
    return this.ros !== null;
  }

  setUrl(url: string) {
    this.url = url;
    if (this.ros) {
      this.disconnect();
      this.connect();
    }
  }
}

export const rosBridgeService = new ROSBridgeService();
