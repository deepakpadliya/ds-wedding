import { useRef, useState } from "react";
import { Music, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { WEDDING } from "@/config/weddingDetails";

export default function MusicToggle() {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  const toggle = () => {
    const audio = ref.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    audio.volume = 0.45;
    audio.play()
      .then(() => setPlaying(true))
      .catch(() => toast.error("Music is unavailable right now."));
  };

  return (
    <div className="no-print fixed bottom-5 left-5 z-[60]">
      <button
        data-testid="music-toggle-btn"
        onClick={toggle}
        disabled={failed}
        className={`flex h-11 w-11 items-center justify-center rounded-full border border-gold/60 bg-ivory/90 shadow-lg backdrop-blur transition-all hover:scale-105 disabled:opacity-40 ${
          playing ? "text-maroon" : "text-gold-deep"
        }`}
        aria-label={playing ? "Pause background music" : "Play background music"}
        title={playing ? "Pause music" : "Play soft music"}
      >
        {playing ? <Music className="h-5 w-5 animate-pulse" /> : <VolumeX className="h-5 w-5" />}
      </button>
      <audio
        ref={ref}
        src={WEDDING.musicUrl}
        loop
        preload="none"
        onError={() => setFailed(true)}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
      />
    </div>
  );
}
