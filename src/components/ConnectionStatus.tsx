import { Bluetooth, BluetoothOff, Loader2, Wifi } from 'lucide-react';
import { Button } from './ui/button';

interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
  deviceName: string | null;
  error: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function ConnectionStatus({
  isConnected,
  isConnecting,
  deviceName,
  error,
  onConnect,
  onDisconnect,
}: ConnectionStatusProps) {
  return (
    <div className="flex flex-col items-center gap-6">
      {/* Connection Indicator */}
      <div className="relative">
        <div 
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${
            isConnected 
              ? 'bg-primary/20 border-2 border-primary glow-primary' 
              : 'bg-secondary border-2 border-border'
          }`}
        >
          {isConnecting ? (
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          ) : isConnected ? (
            <Bluetooth className="w-10 h-10 text-primary" />
          ) : (
            <BluetoothOff className="w-10 h-10 text-muted-foreground" />
          )}
        </div>
        
        {isConnected && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-primary/50 pulse-ring" />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-meter-green rounded-full border-2 border-background flex items-center justify-center">
              <Wifi className="w-3 h-3 text-primary-foreground" />
            </div>
          </>
        )}
      </div>

      {/* Status Text */}
      <div className="text-center">
        <p className={`font-semibold text-lg ${isConnected ? 'text-primary text-glow-primary' : 'text-foreground'}`}>
          {isConnecting 
            ? 'Connecting...' 
            : isConnected 
              ? deviceName || 'Connected'
              : 'Not Connected'}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {isConnected 
            ? 'Receiving audio data' 
            : 'Click below to pair with ESP32'}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-2 max-w-sm">
          <p className="text-sm text-destructive text-center">{error}</p>
        </div>
      )}

      {/* Connect/Disconnect Button */}
      <Button
        variant={isConnected ? 'destructive' : 'connect'}
        size="xl"
        onClick={isConnected ? onDisconnect : onConnect}
        disabled={isConnecting}
        className="min-w-[200px]"
      >
        {isConnecting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Connecting...
          </>
        ) : isConnected ? (
          <>
            <BluetoothOff className="w-5 h-5" />
            Disconnect
          </>
        ) : (
          <>
            <Bluetooth className="w-5 h-5" />
            Connect to ESP32
          </>
        )}
      </Button>
    </div>
  );
}
