import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/config/weddingDetails";
import { scrollToId, scrollToTop } from "@/lib/scroll";
import { Monogram } from "./Ornaments";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id) => {
    setOpen(false);
    setTimeout(() => scrollToId(id), 60);
  };

  return (
    <header
      className={`no-print fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-ivory/85 shadow-[0_10px_30px_-20px_rgba(57,44,38,0.4)] backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="wrap flex h-16 items-center justify-between px-5 sm:px-8">
        <button data-testid="nav-home-btn" onClick={scrollToTop} className="flex items-center gap-2.5">
          <Monogram className="h-9 w-9" />
          <span className="font-display text-base font-semibold text-maroon sm:text-lg">
            Deepak <Heart className="-mt-1 inline h-3.5 w-3.5 text-gold-deep" fill="currentColor" /> Shruti
          </span>
        </button>
        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((l) => (
            <button
              key={l.id}
              data-testid={`nav-${l.id}-link`}
              onClick={() => go(l.id)}
              className="text-[13px] font-medium tracking-wide text-brown/80 transition-colors hover:text-maroon"
            >
              {l.label}
            </button>
          ))}
          <button data-testid="nav-rsvp-cta" onClick={() => go("rsvp")} className="btn-maroon !px-5 !py-2.5 text-xs">
            RSVP
          </button>
        </nav>
        <button
          data-testid="nav-mobile-toggle"
          className="p-2 text-maroon md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-gold/20 bg-ivory/95 backdrop-blur-md md:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {NAV_LINKS.map((l) => (
                <button
                  key={l.id}
                  data-testid={`nav-mobile-${l.id}-link`}
                  onClick={() => go(l.id)}
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-brown/85 hover:bg-gold/10"
                >
                  {l.label}
                </button>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
