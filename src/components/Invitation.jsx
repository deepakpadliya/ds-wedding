import { MessageCircle, Printer } from "lucide-react";
import { INVITATION } from "@/config/weddingDetails";
import Reveal, { SectionHeading } from "./Reveal";

export default function Invitation() {
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  const shareText = `You are cordially invited to the wedding of ${INVITATION.couple} — ${INVITATION.date}, ${INVITATION.venue} RSVP & details: ${siteUrl}`;

  return (
    <section id="invitation" data-testid="invitation-section" className="section-pad scroll-mt-20 bg-ivory">
      <div className="wrap">
        <SectionHeading eyebrow="Digital Invitation" title="You Are Cordially Invited" script="save the date" />

        <Reveal>
          <div
            data-testid="invitation-card"
            className="print-area relative mx-auto max-w-2xl rounded-[28px] border border-gold/50 bg-gradient-to-b from-white/80 to-beige/60 p-8 text-center shadow-[0_30px_80px_-40px_rgba(100,30,43,0.5)] sm:p-12"
          >
            <div className="pointer-events-none absolute inset-3 rounded-[20px] border border-gold/30" />
            <img
              src="/images/couple.png"
              alt="Illustrated portrait of Deepak and Shruti"
              loading="lazy"
              className="mx-auto mb-6 h-32 w-26 object-cover object-top arch-frame border border-gold/40"
              style={{ width: "6.5rem" }}
            />
            <p className="text-xs uppercase tracking-[0.3em] text-gold-deep">{INVITATION.opening}</p>
            <p className="mt-5 font-display text-xl font-semibold text-maroon sm:text-2xl">{INVITATION.groomParents}</p>
            <p className="mt-1 font-cormorant italic text-brown/70">and</p>
            <p className="mt-1 font-display text-xl font-semibold text-maroon sm:text-2xl">{INVITATION.brideParents}</p>
            <p className="mt-5 text-sm text-brown/75">{INVITATION.inviteLine}</p>
            <p className="gold-text mt-4 font-script text-4xl leading-tight sm:text-5xl">{INVITATION.couple}</p>
            <div className="mx-auto my-6 h-px w-40 bg-gold/50" />
            <p className="font-display text-2xl font-semibold text-maroon">{INVITATION.date}</p>
            <p className="mt-2 text-sm text-brown/75">{INVITATION.venue}</p>
          </div>
        </Reveal>

        <Reveal delay={0.15} className="no-print mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            data-testid="invitation-whatsapp-share"
            className="btn-maroon"
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle className="h-4 w-4" /> Share on WhatsApp
          </a>
          <button data-testid="invitation-print-btn" className="btn-outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print Invitation
          </button>
        </Reveal>
      </div>
    </section>
  );
}
