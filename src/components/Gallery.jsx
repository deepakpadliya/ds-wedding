import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { GALLERY } from "@/config/weddingDetails";
import Reveal, { SectionHeading } from "./Reveal";

export default function Gallery() {
  const [idx, setIdx] = useState(-1);
  const open = idx >= 0;

  useEffect(() => {
    const onKey = (e) => {
      if (idx < 0) return;
      if (e.key === "Escape") setIdx(-1);
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % GALLERY.length);
      if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + GALLERY.length) % GALLERY.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx]);

  return (
    <section id="gallery" data-testid="gallery-section" className="section-pad scroll-mt-20 bg-beige/50">
      <div className="wrap">
        <SectionHeading eyebrow="Gallery" title="Moments in Gold" script="our celebration in pictures" />

        <div className="columns-2 gap-4 md:columns-3">
          {GALLERY.map((g, i) => (
            <button
              key={`${g.src}-${i}`}
              data-testid={`gallery-item-${i}`}
              onClick={() => setIdx(i)}
              className="group mb-4 block w-full break-inside-avoid overflow-hidden rounded-xl border border-gold/30"
              aria-label={`Open image: ${g.alt}`}
            >
              <img
                src={g.src}
                alt={g.alt}
                loading="lazy"
                className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-maroon-deep/85 backdrop-blur-sm" onClick={() => setIdx(-1)} />
            <motion.div
              key={idx}
              className="relative z-10 max-h-[85vh] max-w-3xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3 }}
            >
              <img
                src={GALLERY[idx].src}
                alt={GALLERY[idx].alt}
                className="max-h-[78vh] w-auto rounded-xl border border-gold/40 object-contain shadow-2xl"
              />
              <p className="mt-3 text-center text-sm text-ivory/80">{GALLERY[idx].alt}</p>
            </motion.div>
            <button
              data-testid="gallery-lightbox-close"
              onClick={() => setIdx(-1)}
              className="absolute right-4 top-4 z-20 rounded-full bg-ivory/10 p-2.5 text-ivory hover:bg-ivory/20"
              aria-label="Close gallery"
            >
              <X className="h-5 w-5" />
            </button>
            <button
              data-testid="gallery-lightbox-prev"
              onClick={() => setIdx((i) => (i - 1 + GALLERY.length) % GALLERY.length)}
              className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-ivory/10 p-3 text-ivory hover:bg-ivory/20"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              data-testid="gallery-lightbox-next"
              onClick={() => setIdx((i) => (i + 1) % GALLERY.length)}
              className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-ivory/10 p-3 text-ivory hover:bg-ivory/20"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
