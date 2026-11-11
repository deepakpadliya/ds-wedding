import Reveal, { SectionHeading } from "./Reveal";
import { BRIDE, GROOM, STORY } from "@/config/weddingDetails";
import useSettings from "@/hooks/useSettings";

function PersonCard({ img, name, role, note, testId }) {
  return (
    <div data-testid={testId} className="card-royal overflow-hidden text-center">
      <div className="mx-auto mt-7 w-44 overflow-hidden arch-frame border border-gold/40">
        <img src={img} alt={`Illustration of ${name}`} loading="lazy" className="h-56 w-full object-cover object-top" />
      </div>
      <div className="p-5">
        <p className="font-script text-3xl text-maroon">{name}</p>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-gold-deep">{role}</p>
        <p className="mt-2 text-sm text-brown/70">{note}</p>
      </div>
    </div>
  );
}

export default function Story() {
  const { showTimeline } = useSettings();
  return (
    <section id="story" data-testid="story-section" className="section-pad relative scroll-mt-20 bg-ivory">
      <div className="wrap">
        <SectionHeading eyebrow="Our Story" title="A Journey Written in the Stars" script="the beginning of forever" />

        <div className="grid items-center gap-8 md:grid-cols-[1fr_auto_1fr]">
          <Reveal>
            <PersonCard img="/images/bride.png" name={BRIDE.name} role="The Bride" note={STORY.brideFamilyNote} testId="story-bride-card" />
          </Reveal>
          <Reveal delay={0.15} className="flex justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-gold/50 bg-gradient-to-b from-white/80 to-beige/70 shadow-inner">
              <span className="gold-text font-script text-6xl leading-none">&amp;</span>
            </div>
          </Reveal>
          <Reveal delay={0.25}>
            <PersonCard img="/images/groom.png" name={GROOM.name} role="The Groom" note={STORY.groomFamilyNote} testId="story-groom-card" />
          </Reveal>
        </div>

        <Reveal delay={0.1} className="mx-auto mt-10 max-w-2xl text-center">
          <p className="font-lora italic text-brown/75">{STORY.intro}</p>
        </Reveal>

        {showTimeline && (
        <div data-testid="story-timeline" className="relative mt-16">
          <div className="absolute left-5 top-0 h-full w-px bg-gradient-to-b from-gold/60 via-gold/40 to-transparent md:left-1/2 md:-translate-x-1/2" />
          <ol className="space-y-10">
            {STORY.timeline.map((item, i) => (
              <li
                key={item.title}
                className={`relative pl-12 md:w-1/2 md:pl-0 ${i % 2 ? "md:ml-auto md:pl-14" : "md:pr-14"}`}
              >
                <span
                  className={`absolute top-2 left-5 h-[18px] w-[18px] -translate-x-1/2 rounded-full border-2 border-gold bg-ivory md:translate-x-0 ${
                    i % 2 ? "md:-left-[9px]" : "md:-right-[9px]"
                  }`}
                />
                <Reveal delay={0.1}>
                  <div data-testid={`story-timeline-${i}`} className="card-royal p-6">
                    <p className="eyebrow">{item.label}</p>
                    <h3 className="mt-2 font-display text-xl font-semibold text-maroon">{item.title}</h3>
                    <p className="mt-2 text-sm text-brown/75">{item.text}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
        )}
      </div>
    </section>
  );
}
