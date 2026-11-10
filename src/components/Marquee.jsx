import { WEDDING } from "@/config/weddingDetails";

const ITEMS = [
  "Deepak Padliya & Shruti Minda",
  WEDDING.weddingDateLabel,
  WEDDING.mainVenue,
  WEDDING.tagline,
];

function Row({ hidden }) {
  return (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {ITEMS.map((t, i) => (
        <span key={i} className="flex items-center">
          <span className="mx-8 whitespace-nowrap font-cormorant text-xl italic text-ivory/90 sm:text-2xl">{t}</span>
          <svg width="10" height="10" viewBox="0 0 10 10" className="text-gold" aria-hidden="true">
            <path d="M5 0 L10 5 L5 10 L0 5 Z" fill="currentColor" />
          </svg>
        </span>
      ))}
    </div>
  );
}

export default function Marquee() {
  return (
    <div data-testid="wedding-marquee" className="no-print relative overflow-hidden bg-maroon py-5">
      <div className="marquee-track">
        <Row />
        <Row hidden />
      </div>
    </div>
  );
}
