import { Heart } from "lucide-react";
import { NAV_LINKS, WEDDING } from "@/config/weddingDetails";
import { scrollToId, scrollToTop } from "@/lib/scroll";
import useContacts, { contactsForSide } from "@/hooks/useContacts";
import { useSide } from "@/context/SideContext";
import { Monogram } from "./Ornaments";

export default function Footer() {
  const side = useSide();
  const contacts = useContacts();
  return (
    <footer data-testid="footer" className="no-print bg-maroon px-5 py-14 text-center text-ivory sm:px-8">
      <div className="wrap">
        <Monogram className="mx-auto h-12 w-12" />
        <p className="mt-5 font-script text-4xl text-gold-soft">
          Deepak <Heart className="-mt-2 inline h-5 w-5 text-gold" fill="currentColor" /> Shruti
        </p>
        <p className="mt-3 text-sm text-ivory/75">
          {WEDDING.weddingDateLabel} · {WEDDING.mainVenue}
        </p>

        <nav className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {NAV_LINKS.map((l) => (
            <button
              key={l.id}
              data-testid={`footer-${l.id}-link`}
              onClick={() => scrollToId(l.id)}
              className="text-xs font-medium uppercase tracking-[0.18em] text-ivory/70 transition-colors hover:text-gold-soft"
            >
              {l.label}
            </button>
          ))}
        </nav>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">
          {contactsForSide(contacts, side).map((c) => (
            <a key={c.number} data-testid={`footer-contact-${c.number}`} href={WEDDING.telNumber(c.number)} className="text-ivory/80 hover:text-gold-soft">
              {WEDDING.displayNumber(c.number)}
            </a>
          ))}
        </div>

        <div className="mx-auto mt-10 h-px w-40 bg-gold/40" />
        <p className="mt-6 font-script text-2xl text-gold-soft">Made with love for our special day.</p>
        <p className="mt-4 text-[11px] text-ivory/40">All times in Indian Standard Time (IST)</p>
      </div>
    </footer>
  );
}
