import { useState, useCallback, useRef, useEffect } from 'react';
import { Cpu, Code, Volume2, VolumeX } from 'lucide-react';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { WaveformVisualizer } from '@/components/WaveformVisualizer';
import { AudioControls } from '@/components/AudioControls';
import { ESP32CodeModal } from '@/components/ESP32CodeModal';
import { Button } from '@/components/ui/button';
import { useBluetooth, AudioData } from '@/hooks/useBluetooth';

const EMPTY_AUDIO = new Int16Array(128);

const Index = () => {
  const [showCode, setShowCode] = useState(false);
  const [audioData, setAudioData] = useState<AudioData>({
    left: EMPTY_AUDIO,
    right: EMPTY_AUDIO,
    leftRMS: 0,
    rightRMS: 0,
  });

  // Audio playback state
  const [playingLeft, setPlayingLeft] = useState(false);
  const [playingRight, setPlayingRight] = useState(false);
  const [mutedLeft, setMutedLeft] = useState(false);
  const [mutedRight, setMutedRight] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize AudioContext on user interaction
  const getAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
    }
    // Resume if suspended (browser autoplay policy)
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const handleAudioData = useCallback(async (data: AudioData) => {
    setAudioData(data);

    // Only play if at least one channel is enabled
    if ((!playingLeft || mutedLeft) && (!playingRight || mutedRight)) {
      return;
    }

    const ctx = await getAudioContext();

    if (playingLeft && !mutedLeft && data.left.length > 0) {
      const buffer = ctx.createBuffer(1, data.left.length, 16000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < data.left.length; i++) {
        channelData[i] = data.left[i] / 32768;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    }

    if (playingRight && !mutedRight && data.right.length > 0) {
      const buffer = ctx.createBuffer(1, data.right.length, 16000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < data.right.length; i++) {
        channelData[i] = data.right[i] / 32768;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    }
  }, [playingLeft, playingRight, mutedLeft, mutedRight, getAudioContext]);

  const bluetooth = useBluetooth(handleAudioData);

  // Reset audio data when disconnected
  useEffect(() => {
    if (!bluetooth.isConnected) {
      setAudioData({
        left: EMPTY_AUDIO,
        right: EMPTY_AUDIO,
        leftRMS: 0,
        rightRMS: 0,
      });
    }
  }, [bluetooth.isConnected]);

  return (
    <div className="min-h-screen gradient-mesh">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center glow-primary">
              <Cpu className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-glow-primary">ESP32 Dual Mic</h1>
              <p className="text-xs text-muted-foreground font-mono">Bluetooth Audio Monitor</p>
            </div>
          </div>
          
          <Button variant="audio-control" size="sm" onClick={() => setShowCode(true)}>
            <Code className="w-4 h-4" />
            <span className="hidden sm:inline">ESP32 Code</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Connection Section */}
        <section className="mb-12">
          <ConnectionStatus
            isConnected={bluetooth.isConnected}
            isConnecting={bluetooth.isConnecting}
            deviceName={bluetooth.deviceName}
            error={bluetooth.error}
            onConnect={bluetooth.connect}
            onDisconnect={bluetooth.disconnect}
          />
        </section>

        {/* Audio Channels */}
        <section className="grid gap-8 lg:grid-cols-2">
          {/* Left Channel - INMP441 */}
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-mic-left" />
                INMP441
                <span className="text-xs text-muted-foreground font-normal">(Left Channel)</span>
              </h2>
              <AudioControls
                label=""
                color="left"
                isPlaying={playingLeft}
                isMuted={mutedLeft}
                onTogglePlay={() => setPlayingLeft(!playingLeft)}
                onToggleMute={() => setMutedLeft(!mutedLeft)}
              />
            </div>
            <WaveformVisualizer
              data={audioData.left}
              color="left"
              label="Channel L"
              rms={audioData.leftRMS}
            />
          </div>

          {/* Right Channel - SmartElex */}
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-mic-right" />
                SmartElex
                <span className="text-xs text-muted-foreground font-normal">(Right Channel)</span>
              </h2>
              <AudioControls
                label=""
                color="right"
                isPlaying={playingRight}
                isMuted={mutedRight}
                onTogglePlay={() => setPlayingRight(!playingRight)}
                onToggleMute={() => setMutedRight(!mutedRight)}
              />
            </div>
            <WaveformVisualizer
              data={audioData.right}
              color="right"
              label="Channel R"
              rms={audioData.rightRMS}
            />
          </div>
        </section>

        {/* Quick Stats */}
        {bluetooth.isConnected && (
          <section className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-card/30 backdrop-blur-sm border border-border rounded-lg p-4 text-center">
              <p className="text-2xl font-bold font-mono text-mic-left">{audioData.leftRMS.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Left RMS</p>
            </div>
            <div className="bg-card/30 backdrop-blur-sm border border-border rounded-lg p-4 text-center">
              <p className="text-2xl font-bold font-mono text-mic-right">{audioData.rightRMS.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Right RMS</p>
            </div>
            <div className="bg-card/30 backdrop-blur-sm border border-border rounded-lg p-4 text-center">
              <p className="text-2xl font-bold font-mono text-foreground">16k</p>
              <p className="text-xs text-muted-foreground">Sample Rate</p>
            </div>
            <div className="bg-card/30 backdrop-blur-sm border border-border rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1">
                {playingLeft && !mutedLeft && <Volume2 className="w-5 h-5 text-mic-left" />}
                {playingRight && !mutedRight && <Volume2 className="w-5 h-5 text-mic-right" />}
                {(!playingLeft || mutedLeft) && (!playingRight || mutedRight) && (
                  <VolumeX className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Audio Output</p>
            </div>
          </section>
        )}

        {/* Instructions when not connected */}
        {!bluetooth.isConnected && (
          <section className="mt-12 max-w-xl mx-auto">
            <div className="bg-card/30 backdrop-blur-sm border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4 text-center">Quick Setup</h3>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">1</span>
                  <span>Click "ESP32 Code" button to get the Arduino code</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">2</span>
                  <span>Upload the code to your ESP32-WROOM via Arduino IDE</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">3</span>
                  <span>Connect INMP441 & SmartElex mics to I2S pins</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">4</span>
                  <span>Click "Connect to ESP32" and select "ESP32 Dual Mic"</span>
                </li>
              </ol>
              <p className="text-xs text-muted-foreground/70 mt-4 text-center">
                Note: Web Bluetooth requires Chrome or Edge browser
              </p>
            </div>
          </section>
        )}
      </main>

      {/* ESP32 Code Modal */}
      <ESP32CodeModal isOpen={showCode} onClose={() => setShowCode(false)} />
    </div>
  );
};

export default Index;
