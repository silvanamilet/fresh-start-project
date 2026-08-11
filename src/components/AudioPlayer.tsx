import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

function fmt(s: number) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function AudioPlayer({ src }: { src: string }) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [tocando, setTocando] = useState(false);
  const [atual, setAtual] = useState(0);
  const [duracao, setDuracao] = useState(0);

  useEffect(() => {
    setTocando(false);
    setAtual(0);
  }, [src]);

  const toggle = () => {
    const a = ref.current;
    if (!a) return;
    if (a.paused) {
      void a.play();
      setTocando(true);
    } else {
      a.pause();
      setTocando(false);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-marfim2 px-4 py-3">
      <audio
        ref={ref}
        src={src}
        preload="metadata"
        onTimeUpdate={(e) => setAtual(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuracao(e.currentTarget.duration)}
        onEnded={() => setTocando(false)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={tocando ? "Pausar áudio" : "Tocar áudio"}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-vinho text-primary-foreground transition-transform active:scale-95"
      >
        {tocando ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
      </button>
      <div className="flex-1">
        <input
          type="range"
          min={0}
          max={duracao || 0}
          step={0.1}
          value={atual}
          aria-label="Progresso do áudio"
          onChange={(e) => {
            const v = Number(e.target.value);
            if (ref.current) ref.current.currentTime = v;
            setAtual(v);
          }}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border accent-[var(--dourado)]"
        />
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>{fmt(atual)}</span>
          <span>{fmt(duracao)}</span>
        </div>
      </div>
    </div>
  );
}
