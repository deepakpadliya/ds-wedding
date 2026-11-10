import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Story from "@/components/Story";
import Events from "@/components/Events";
import Invitation from "@/components/Invitation";
import Gallery from "@/components/Gallery";
import VenueTravel from "@/components/VenueTravel";
import RsvpSection from "@/components/RsvpSection";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import MusicToggle from "@/components/MusicToggle";

export default function Home() {
  return (
    <main className="relative bg-ivory">
      <Navbar />
      <Hero />
      <Marquee />
      <Story />
      <Events />
      <Invitation />
      <Gallery />
      <VenueTravel />
      <RsvpSection />
      <Contact />
      <Footer />
      <MusicToggle />
    </main>
  );
}
