import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WEDDING } from "@/config/weddingDetails";

const TARGET = new Date(WEDDING.countdownTarget).getTime();

function calc() {
  const diff = Math.max(0, TARGET - Date.now());
  return {
    over: diff <= 0,
    days: Math.floor(diff / 86400000),
    hours: Math.floor(diff / 3600000) % 24,
    minutes: Math.floor(diff / 60000) % 60,
    seconds: Math.floor(diff / 1000) % 60,
  };
}

export default function Countdown() {
  const [t, setT] = useState(calc);

  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, []);

  if (t.over) {
    return (
      <div data-testid="countdown-complete" className="card-royal mx-auto max-w-md px-6 py-5">
        <p className="font-script text-3xl text-gold-deep">The celebrations have begun!</p>
        <p className="mt-1 text-sm text-brown/70">
          Wishing Deepak &amp; Shruti a lifetime of love and happiness.
        </p>
      </div>
    );
  }

  const cells = [
    { label: "Days", value: t.days },
    { label: "Hours", value: t.hours },
    { label: "Minutes", value: t.minutes },
    { label: "Seconds", value: t.seconds },
  ];

  return (
    <div data-testid="countdown-timer" className="flex items-stretch justify-center gap-2.5 sm:gap-4">
      {cells.map((c) => (
        <div key={c.label} className="card-royal min-w-[68px] px-3 py-3 text-center sm:min-w-[88px] sm:px-4">
          <div className="h-8 overflow-hidden font-display text-2xl font-semibold leading-8 text-maroon sm:h-10 sm:text-4xl sm:leading-10">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={c.value}
                className="block"
                initial={{ y: 14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -14, opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                {String(c.value).padStart(2, "0")}
              </motion.span>
            </AnimatePresence>
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-gold-deep">{c.label}</p>
        </div>
      ))}
    </div>
  );
}
