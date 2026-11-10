import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Clock, MapPin, Navigation, X } from "lucide-react";
import { Link } from "react-router-dom";
import { DAYS, mapLink } from "@/config/weddingDetails";
import useEvents, { eventVisibleToSide } from "@/hooks/useEvents";
import { useSide } from "@/context/SideContext";
import Reveal, { SectionHeading } from "./Reveal";

function EventModal({ event, onClose }) {
  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-maroon-deep/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        data-testid="event-modal"
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-ivory shadow-2xl"
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <button
          data-testid="event-modal-close"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-ivory/90 p-2 text-maroon shadow"
          aria-label="Close details"
        >
          <X className="h-4 w-4" />
        </button>
        <img src={event.image} alt={`${event.title} illustration`} className="h-52 w-full object-cover sm:h-60" />
        <div className="p-6">
          <h3 className="font-display text-2xl font-semibold text-maroon">{event.title}</h3>
          <div className="mt-4 space-y-2.5 text-sm text-brown/85">
            <p className="flex items-center gap-2.5">
              <Calendar className="h-4 w-4 shrink-0 text-gold-deep" /> {event.dateLabel}
            </p>
            <p className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 shrink-0 text-gold-deep" /> {event.time} IST
            </p>
            <p className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" /> {event.venue}
            </p>
          </div>
          <p className="mt-4 font-lora italic text-brown/75">{event.description}</p>
          {event.mapQuery && (
            <a
              data-testid="event-directions-link"
              href={mapLink(event.mapQuery)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline mt-6 w-full !py-3"
            >
              <Navigation className="h-4 w-4" /> Get Directions
            </a>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Events() {
  const [active, setActive] = useState(null);
  const side = useSide();
  const EVENTS = useEvents().filter((e) => eventVisibleToSide(e, side));

  return (
    <section id="events" data-testid="events-section" className="section-pad scroll-mt-20 bg-beige/50">
      <div className="wrap">
        <SectionHeading eyebrow="Wedding Events" title="Three Days of Celebration" script={`${EVENTS.length} blessed occasions`} />

        {side && (
          <p data-testid="events-side-note" className="-mt-6 mb-10 text-center text-sm text-brown/70">
            Showing the celebrations for {side === "bride" ? "Shruti's" : "Deepak's"} side ·{" "}
            <Link to="/all" className="font-medium text-maroon underline underline-offset-4">view all events</Link>
          </p>
        )}

        {DAYS.filter((d) => EVENTS.some((e) => e.day === d.day)).map((d) => (
          <div key={d.day} className="mb-14 last:mb-0">
            <Reveal className="mb-7 flex items-center gap-4">
              <span className="h-px flex-1 bg-gold/40" />
              <div className="text-center">
                <p className="eyebrow">{d.weekday}</p>
                <p className="font-display text-xl font-semibold text-maroon sm:text-2xl">{d.dateLabel}</p>
              </div>
              <span className="h-px flex-1 bg-gold/40" />
            </Reveal>

            <div className="grid justify-items-center gap-7 sm:grid-cols-2 lg:grid-cols-3 lg:justify-items-stretch">
              {EVENTS.filter((e) => e.day === d.day).map((e, i) => (
                <Reveal key={e.id} delay={i * 0.08} className="h-full w-full max-w-md lg:max-w-none">
                  <article
                    data-testid={`event-card-${e.id}`}
                    className="card-royal group flex h-full flex-col overflow-hidden transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_28px_60px_-30px_rgba(100,30,43,0.45)]"
                  >
                    <div className="relative overflow-hidden">
                      <img
                        src={e.image}
                        alt={`${e.title} illustration`}
                        loading="lazy"
                        className="h-52 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      {!side && e.side !== "both" && (
                        <span className="absolute right-4 top-4 rounded-full bg-maroon/90 px-3 py-1 text-[11px] font-medium tracking-wide text-ivory">
                          {e.side === "bride" ? "Bride's side" : "Groom's side"}
                        </span>
                      )}
                      <span className="absolute left-4 top-4 rounded-full bg-ivory/90 px-3 py-1 text-[11px] font-semibold tracking-wide text-maroon">
                        {e.time} IST
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="font-display text-xl font-semibold text-maroon">{e.title}</h3>
                      <p className="mt-1.5 flex items-start gap-1.5 text-xs text-brown/70">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-deep" /> {e.venue}
                      </p>
                      <p className="mt-3 line-clamp-2 text-sm text-brown/75">{e.description}</p>
                      <button
                        data-testid={`event-details-btn-${e.id}`}
                        onClick={() => setActive(e)}
                        className="btn-outline mt-4 w-full !py-2.5 text-xs md:mt-auto"
                      >
                        View Details
                      </button>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {active && <EventModal event={active} onClose={() => setActive(null)} />}
      </AnimatePresence>
    </section>
  );
}
