import { useState, useCallback, useRef } from 'react';

// ESP32 BLE Audio Service UUIDs
const AUDIO_SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const AUDIO_CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

export interface AudioData {
  left: Int16Array;
  right: Int16Array;
  leftRMS: number;
  rightRMS: number;
}

export interface BluetoothState {
  isConnected: boolean;
  isConnecting: boolean;
  deviceName: string | null;
  error: string | null;
}

// Type definitions for Web Bluetooth API (not yet in standard TypeScript lib)
type BLEDevice = {
  name?: string;
  gatt?: {
    connected: boolean;
    connect: () => Promise<any>;
    disconnect: () => void;
    getPrimaryService: (uuid: string) => Promise<any>;
  };
  addEventListener: (type: string, listener: () => void) => void;
};

type BLECharacteristic = {
  value?: DataView;
  startNotifications: () => Promise<any>;
  addEventListener: (type: string, listener: (e: any) => void) => void;
  removeEventListener: (type: string, listener: (e: any) => void) => void;
};

export function useBluetooth(onAudioData: (data: AudioData) => void) {
  const [state, setState] = useState<BluetoothState>({
    isConnected: false,
    isConnecting: false,
    deviceName: null,
    error: null,
  });

  const deviceRef = useRef<BLEDevice | null>(null);
  const characteristicRef = useRef<BLECharacteristic | null>(null);

  const parseAudioPacket = useCallback((buffer: ArrayBuffer): AudioData => {
    const data = new Uint8Array(buffer);
    const frames = data.length / 4;
    
    const left = new Int16Array(frames);
    const right = new Int16Array(frames);
    
    let sumL = 0, sumR = 0;
    
    for (let i = 0; i < frames; i++) {
      // Left channel (first half)
      left[i] = data[i * 2] | (data[i * 2 + 1] << 8);
      // Right channel (second half)
      right[i] = data[frames * 2 + i * 2] | (data[frames * 2 + i * 2 + 1] << 8);
      
      sumL += left[i] * left[i];
      sumR += right[i] * right[i];
    }
    
    return {
      left,
      right,
      leftRMS: Math.sqrt(sumL / frames),
      rightRMS: Math.sqrt(sumR / frames),
    };
  }, []);

  const handleNotification = useCallback((event: any) => {
    const characteristic = event.target;
    if (characteristic?.value) {
      const audioData = parseAudioPacket(characteristic.value.buffer);
      onAudioData(audioData);
    }
  }, [onAudioData, parseAudioPacket]);

  const connect = useCallback(async () => {
    // Check if Web Bluetooth is available
    const nav = navigator as any;
    if (!nav.bluetooth) {
      setState(prev => ({ ...prev, error: 'Web Bluetooth is not supported. Use Chrome or Edge on desktop.' }));
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const device: BLEDevice = await nav.bluetooth.requestDevice({
        filters: [{ services: [AUDIO_SERVICE_UUID] }],
        optionalServices: [AUDIO_SERVICE_UUID],
      });

      deviceRef.current = device;

      device.addEventListener('gattserverdisconnected', () => {
        setState({
          isConnected: false,
          isConnecting: false,
          deviceName: null,
          error: null,
        });
      });

      const server = await device.gatt?.connect();
      if (!server) throw new Error('Failed to connect to GATT server');

      const service = await server.getPrimaryService(AUDIO_SERVICE_UUID);
      const characteristic: BLECharacteristic = await service.getCharacteristic(AUDIO_CHAR_UUID);
      
      characteristicRef.current = characteristic;
      
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', handleNotification);

      setState({
        isConnected: true,
        isConnecting: false,
        deviceName: device.name || 'ESP32 Audio',
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connection failed';
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: message.includes('cancelled') ? null : message,
      }));
    }
  }, [handleNotification]);

  const disconnect = useCallback(() => {
    if (characteristicRef.current) {
      characteristicRef.current.removeEventListener('characteristicvaluechanged', handleNotification);
    }
    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.gatt.disconnect();
    }
    setState({
      isConnected: false,
      isConnecting: false,
      deviceName: null,
      error: null,
    });
  }, [handleNotification]);

  return {
    ...state,
    connect,
    disconnect,
  };
}
