import { MessageCircle, Phone } from "lucide-react";
import { WEDDING } from "@/config/weddingDetails";
import useContacts from "@/hooks/useContacts";
import { useSide } from "@/context/SideContext";
import Reveal, { SectionHeading } from "./Reveal";

function ContactCard({ c, i, testKey }) {
  return (
    <Reveal delay={i * 0.1} className="h-full">
      <div data-testid={`contact-card-${testKey}`} className="card-royal h-full p-7 text-center">
        {c.name && <p className="mb-1 font-script text-2xl text-gold-deep">{c.name}</p>}
        <p className="font-display text-2xl font-semibold tracking-wide text-maroon">{WEDDING.displayNumber(c.number)}</p>
        <p className="mt-1.5 text-xs uppercase tracking-[0.2em] text-gold-deep">{c.label}</p>
        <div className="mt-5 flex justify-center gap-3">
          <a data-testid={`contact-call-${testKey}`} className="btn-maroon !px-5 !py-2.5 text-xs" href={WEDDING.telNumber(c.number)}>
            <Phone className="h-4 w-4" /> Call
          </a>
          <a
            data-testid={`contact-whatsapp-${testKey}`}
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
  );
}

const GROUPS = { groom: "Deepak's side (Groom)", bride: "Shruti's side (Bride)" };

export default function Contact() {
  const side = useSide();
  const contacts = useContacts();
  // On /bride and /groom show that side's contacts; on the common page show both, grouped.
  const groups = side ? [[side, contacts[side]]] : [["groom", contacts.groom], ["bride", contacts.bride]];

  return (
    <section id="contact" data-testid="contact-section" className="section-pad scroll-mt-20 bg-ivory">
      <div className="wrap">
        <SectionHeading eyebrow="Contact" title="Wedding Enquiries & Assistance" script="we are happy to help" />
        <div className="space-y-10">
          {groups.map(([key, list]) => (
            <div key={key}>
              {!side && <p className="eyebrow mb-4 text-center">{GROUPS[key]}</p>}
              <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
                {list.map((c, i) => (
                  <ContactCard key={`${key}-${c.number}`} c={c} i={i} testKey={side ? c.number : `${key}-${c.number}`} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
