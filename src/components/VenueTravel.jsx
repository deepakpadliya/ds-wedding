import { Bus, Home, Hotel, MapPin, Navigation } from "lucide-react";
import { TRAVEL } from "@/config/weddingDetails";
import Reveal, { SectionHeading } from "./Reveal";

const ICONS = [MapPin, MapPin, Home];

export default function VenueTravel() {
  return (
    <section id="venue" data-testid="venue-section" className="section-pad scroll-mt-20 bg-ivory">
      <div className="wrap">
        <SectionHeading eyebrow="Venue & Travel" title="Where the Celebration Unfolds" script="pratapgarh awaits you" />

        <div className="grid gap-6 md:grid-cols-3">
          {TRAVEL.venues.map((v, i) => {
            const Icon = ICONS[i] || MapPin;
            return (
              <Reveal key={v.name} delay={i * 0.1} className="h-full">
                <div data-testid={`venue-card-${i}`} className="card-royal flex h-full flex-col p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-maroon text-ivory">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-xl font-semibold text-maroon">{v.name}</h3>
                  <p className="mt-2 flex-1 text-sm text-brown/75">{v.note}</p>
                  {v.mapQuery ? (
                    <a
                      data-testid={`venue-directions-${i}`}
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.mapQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline mt-5 !py-2.5 text-xs"
                    >
                      <Navigation className="h-4 w-4" /> Get Directions
                    </a>
                  ) : (
                    <span className="mt-5 inline-flex items-center justify-center rounded-full border border-dashed border-gold/60 bg-gold/5 px-4 py-2.5 text-xs italic text-brown/60">
                      Private — address shared personally with invited guests
                    </span>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2">
          {TRAVEL.guidance.map((g, i) => {
            const Icon = i === 0 ? Bus : Hotel;
            return (
              <Reveal key={g.title} delay={0.1 + i * 0.1} className="h-full">
                <div data-testid={`travel-guidance-${i}`} className="rounded-2xl border border-dashed border-gold/50 bg-beige/40 p-6">
                  <p className="flex items-center gap-2.5 font-display text-lg font-semibold text-maroon">
                    <Icon className="h-5 w-5 text-gold-deep" /> {g.title}
                  </p>
                  <p className="mt-2.5 text-sm italic text-brown/55">{g.text}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
