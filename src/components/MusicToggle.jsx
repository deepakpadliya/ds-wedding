import { useEffect, useRef, useState } from "react";
import { Music, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { WEDDING, GROOM, BRIDE } from "@/config/weddingDetails";

export default function MusicToggle() {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const audio = ref.current;
    if (!audio) return;
    audio.volume = 0.45;
    const events = ["pointerdown", "touchstart", "keydown", "wheel", "scroll"];
    const cleanup = () => events.forEach((e) => window.removeEventListener(e, start));
    function start() {
      audio.play().then(cleanup).catch(() => {});
    }
    // Try immediately; if the browser blocks it, start on first user interaction.
    audio.play().then(cleanup).catch(() => {
      events.forEach((e) => window.addEventListener(e, start, { passive: true }));
    });
    return cleanup;
  }, []);

  const [entered, setEntered] = useState(() => {
    try { return sessionStorage.getItem("entered") === "1"; } catch { return false; }
  });

  const enter = () => {
    try { sessionStorage.setItem("entered", "1"); } catch {}
    setEntered(true);
    const audio = ref.current;
    if (audio) {
      audio.volume = 0.45;
      audio.play().catch(() => {});
    }
  };

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
    <>
    {!entered && (
      <div className="no-print fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-ivory px-6 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-gold-deep">You are cordially invited to the wedding of</p>
        <h1 className="font-serif text-4xl text-maroon sm:text-6xl">
          {BRIDE.name.split(" ")[0]} <span className="text-gold-deep">&amp;</span> {GROOM.name.split(" ")[0]}
        </h1>
        <button
          data-testid="enter-invitation-btn"
          onClick={enter}
          className="rounded-full border border-gold bg-maroon px-8 py-3 text-ivory shadow-lg transition hover:scale-105"
        >
          Open Invitation
        </button>
      </div>
    )}
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
        autoPlay
        preload="auto"
        onError={() => setFailed(true)}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
      />
    </div>
    </>
  );
}
