import { Slider } from "@/components/ui/slider";

type OutputVolumePanelProps = {
  master: number; // gain multiplier (e.g. 1.0 = 100%)
  left: number;
  right: number;
  onMasterChange: (value: number) => void;
  onLeftChange: (value: number) => void;
  onRightChange: (value: number) => void;
};

const toPercent = (gain: number) => Math.round(gain * 100);
const fromPercent = (percent: number) => percent / 100;

export function OutputVolumePanel({
  master,
  left,
  right,
  onMasterChange,
  onLeftChange,
  onRightChange,
}: OutputVolumePanelProps) {
  return (
    <section className="mb-10">
      <div className="bg-card/30 backdrop-blur-sm border border-border rounded-xl p-6">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <h3 className="font-semibold">Output Volume</h3>
            <p className="text-xs text-muted-foreground">
              Increase Master if you can see waveform but can’t hear audio.
            </p>
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            Master: {toPercent(master)}%
          </p>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-3">
          {/* Master */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Master</p>
              <p className="text-xs text-muted-foreground font-mono">{toPercent(master)}%</p>
            </div>
            <Slider
              value={[toPercent(master)]}
              min={0}
              max={400}
              step={1}
              onValueChange={(v) => onMasterChange(fromPercent(v[0] ?? 0))}
            />
          </div>

          {/* Left */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-mic-left" />
                Left
              </p>
              <p className="text-xs text-muted-foreground font-mono">{toPercent(left)}%</p>
            </div>
            <Slider
              value={[toPercent(left)]}
              min={0}
              max={400}
              step={1}
              onValueChange={(v) => onLeftChange(fromPercent(v[0] ?? 0))}
            />
          </div>

          {/* Right */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-mic-right" />
                Right
              </p>
              <p className="text-xs text-muted-foreground font-mono">{toPercent(right)}%</p>
            </div>
            <Slider
              value={[toPercent(right)]}
              min={0}
              max={400}
              step={1}
              onValueChange={(v) => onRightChange(fromPercent(v[0] ?? 0))}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
