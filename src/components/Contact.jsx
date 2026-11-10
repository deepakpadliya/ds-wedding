import { MessageCircle, Phone } from "lucide-react";
import { WEDDING } from "@/config/weddingDetails";
import Reveal, { SectionHeading } from "./Reveal";

export default function Contact() {
  return (
    <section id="contact" data-testid="contact-section" className="section-pad scroll-mt-20 bg-ivory">
      <div className="wrap">
        <SectionHeading eyebrow="Contact" title="Wedding Enquiries & Assistance" script="we are happy to help" />
        <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
          {WEDDING.contacts.map((c, i) => (
            <Reveal key={c.number} delay={i * 0.1} className="h-full">
              <div data-testid={`contact-card-${c.number}`} className="card-royal p-7 text-center">
                <p className="font-display text-2xl font-semibold tracking-wide text-maroon">+91 {c.number}</p>
                <p className="mt-1.5 text-xs uppercase tracking-[0.2em] text-gold-deep">{c.label}</p>
                <div className="mt-5 flex justify-center gap-3">
                  <a
                    data-testid={`contact-call-${c.number}`}
                    className="btn-maroon !px-5 !py-2.5 text-xs"
                    href={WEDDING.telNumber(c.number)}
                  >
                    <Phone className="h-4 w-4" /> Call
                  </a>
                  <a
                    data-testid={`contact-whatsapp-${c.number}`}
                    className="btn-outline !px-5 !py-2.5 text-xs"
                    href={WEDDING.whatsappNumber(c.number)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
