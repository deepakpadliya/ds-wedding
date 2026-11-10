import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Calendar, ChevronDown, Heart, MapPin } from "lucide-react";
import { WEDDING } from "@/config/weddingDetails";
import Countdown from "./Countdown";
import Petals from "./Petals";
import { GoldArch, HangingGarland, Mandala } from "./Ornaments";
import { scrollToId } from "@/lib/scroll";

const ease = [0.22, 1, 0.36, 1];

function MaskLine({ children, delay, className = "" }) {
  return (
    <span className={`block overflow-hidden ${className}`}>
      <motion.span
        className="block"
        initial={{ y: "115%" }}
        animate={{ y: 0 }}
        transition={{ duration: 1.1, delay, ease }}
      >
        {children}
      </motion.span>
    </span>
  );
}

export default function Hero() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yMandala = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 120]);
  const yGarland = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -40]);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    <section
      ref={ref}
      data-testid="hero-section"
      className="grain relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-ivory px-5 pb-20 pt-24 text-center sm:px-8"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(60% 45% at 50% 30%, rgba(214,179,106,0.22), rgba(255,249,240,0) 70%)" }}
      />
      <motion.div style={{ y: yMandala }} className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] opacity-[0.12]">
        <Mandala className="spin-slow h-full w-full" />
      </motion.div>
      <motion.div style={{ y: yMandala }} className="pointer-events-none absolute -left-48 bottom-0 h-[520px] w-[520px] opacity-[0.08]">
        <Mandala className="spin-slow h-full w-full" />
      </motion.div>

      <motion.div style={{ y: yGarland }} className="garland-sway pointer-events-none absolute inset-x-0 top-0 z-10">
        <HangingGarland className="h-16 w-full sm:h-20" />
      </motion.div>

      <Petals className="z-10" />

      <GoldArch className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[94%] max-h-[780px] w-auto -translate-x-1/2 -translate-y-1/2 opacity-70" />

      <motion.div style={{ opacity: fade }} className="relative z-20 flex max-w-3xl flex-col items-center">
        <MaskLine delay={0.15}>
          <p className="eyebrow">With the blessings of our families</p>
        </MaskLine>
        <MaskLine delay={0.3}>
          <p className="gold-text mt-4 font-script text-3xl sm:text-4xl">{WEDDING.tagline}</p>
        </MaskLine>

        <h1 className="mt-6 font-display font-semibold text-maroon">
          <MaskLine delay={0.5}>
            <span className="block text-5xl tracking-wide sm:text-6xl lg:text-7xl">Deepak Padliya</span>
          </MaskLine>
          <MaskLine delay={0.75}>
            <span className="my-3 flex items-center justify-center gap-3 sm:my-4">
              <span className="h-px w-14 bg-gold/60" />
              <Heart className="h-7 w-7 text-gold-deep" fill="currentColor" />
              <span className="h-px w-14 bg-gold/60" />
            </span>
          </MaskLine>
          <MaskLine delay={0.9}>
            <span className="block text-5xl tracking-wide sm:text-6xl lg:text-7xl">Shruti Minda</span>
          </MaskLine>
        </h1>

        <MaskLine delay={1.15}>
          <p className="mt-6 max-w-xl font-lora text-base italic text-brown/75 sm:text-lg">{WEDDING.supportingLine}</p>
        </MaskLine>

        <MaskLine delay={1.3}>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 text-xs font-medium text-brown/80 sm:text-sm">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-white/70 px-4 py-2">
              <Calendar className="h-4 w-4 text-gold-deep" /> {WEDDING.weddingDateLabel}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-white/70 px-4 py-2">
              <MapPin className="h-4 w-4 text-gold-deep" /> {WEDDING.mainVenue}
            </span>
          </div>
        </MaskLine>

        <MaskLine delay={1.45} className="mt-8 w-full">
          <Countdown />
        </MaskLine>

        <MaskLine delay={1.6}>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button data-testid="hero-explore-btn" className="btn-maroon" onClick={() => scrollToId("story")}>
              Explore Our Wedding
            </button>
            <button data-testid="hero-invitation-btn" className="btn-outline" onClick={() => scrollToId("invitation")}>
              View Invitation
            </button>
          </div>
        </MaskLine>
      </motion.div>

      <motion.button
        data-testid="hero-scroll-cue"
        onClick={() => scrollToId("story")}
        className="absolute bottom-6 z-20 text-gold-deep"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2 }}
        aria-label="Scroll down"
      >
        <ChevronDown className="bounce-soft h-6 w-6" />
      </motion.button>
    </section>
  );
}
