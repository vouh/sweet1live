import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";

export default function HomeLiveNights() {
  return (
    <section className="night-poster" aria-labelledby="night-poster-title">
      <div className="night-poster__top">
        <span>Sweet1ne Live / Chadwell Heath</span>
        <span>Always in the mood for you</span>
      </div>
      <div className="night-poster__grid">
        <Reveal className="night-poster__copy" variant="up">
          <p className="night-poster__label">Upcoming shows &amp; live nights</p>
          <h2 id="night-poster-title">
            GO OUT.
            <br />
            <span>GO ALL IN.</span>
          </h2>
          <p className="night-poster__intro">
            Brunches, Sunday roasts, ticketed performances and private hire — find your next night
            out at Sweet1ne Live.
          </p>
          <Link href="/whats-on" className="night-poster__cta">
            See upcoming events <span aria-hidden>↗</span>
          </Link>
          <a className="night-poster__updates" href="#event-updates">
            Get event updates <span aria-hidden>↗</span>
          </a>
        </Reveal>
        <Reveal className="night-poster__visual" variant="clip" delay={120}>
          <Image
            src="/images/s35.webp"
            alt="Blue velvet seating and colourful lighting inside Sweet1ne Live"
            fill
            sizes="(max-width: 800px) 100vw, 55vw"
            className="night-poster__photo"
          />
          <div className="night-poster__stamp" aria-hidden>
            THE NIGHT
            <br />
            IS YOURS <span>✳</span>
          </div>
          <span className="night-poster__caption">CHADWELL HEATH / SWEET1NE LIVE</span>
        </Reveal>
      </div>
      <div className="night-poster__bottom">
        <Reveal delay={80}>
          <Link href="/whats-on" className="night-poster__route">
            <span className="night-poster__number">01</span>
            <div>
              <small>Join a night</small>
              <h3>What&apos;s coming up?</h3>
              <p>Browse the lineup and lock in tickets.</p>
            </div>
            <span className="night-poster__route-arrow" aria-hidden>
              ↗
            </span>
          </Link>
        </Reveal>
        <Reveal delay={180}>
          <Link href="/venue-hire" className="night-poster__route">
            <span className="night-poster__number">02</span>
            <div>
              <small>Make it your occasion</small>
              <h3>Private hire &amp; celebrations.</h3>
              <p>Birthdays, brunches and restaurant hire.</p>
            </div>
            <span className="night-poster__route-arrow" aria-hidden>
              ↗
            </span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
