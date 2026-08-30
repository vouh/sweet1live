import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import Parallax from "@/components/Parallax";
import ConversionBand from "@/components/ConversionBand";
import BrandCloser, { FooterFlyover } from "@/components/BrandCloser";
import SplitReveal from "@/components/motion/SplitReveal";
import MaskReveal from "@/components/motion/MaskReveal";
import ImageHover from "@/components/motion/ImageHover";
import ScrollMarquee from "@/components/motion/ScrollMarquee";
import DrawLine from "@/components/motion/DrawLine";
import Magnetic from "@/components/motion/Magnetic";
import BrandTagline from "@/components/BrandTagline";
import FoodCollectionCart from "@/components/FoodCollectionCart";
import { formatPrice, getMenuItems, groupMenuByCourse } from "@/lib/menus";
import { IMG } from "@/lib/images";

export const dynamic = "force-dynamic";

const HERO = IMG.dining;
const COURSE_IMAGES: Record<string, string> = {
  "Small Plates": IMG.dining,
  Mains: IMG.menuPlating,
  "The Cellar": IMG.menuCellar,
};

export default async function MenusPage() {
  const items = await getMenuItems();
  const courses = groupMenuByCourse(items, COURSE_IMAGES);

  return (
    <>
      <Nav active="/menus" />
      <main className="flex-grow w-full">
        <section className="sticky top-0 z-0 min-h-[74vh] flex items-center overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${HERO}')` }}
          />
          <div className="absolute inset-0 bg-[#1a100c]/30" />

          <div className="relative z-10 w-full max-w-container-max mx-auto px-margin-mobile md:px-gutter">
            <Reveal>
              <BrandTagline variant="eyebrow" onMedia className="mb-4" />
              <span className="font-label-caps text-label-caps text-[#d4a574] uppercase tracking-[0.35em] block mb-6">
                The Kitchen
              </span>
            </Reveal>
            <SplitReveal
              as="h1"
              text="Evening Fare"
              accentWord="Fare"
              className="font-display-lg text-[56px] sm:text-[88px] md:text-[120px] leading-[0.92] uppercase tracking-[0.01em] text-white drop-shadow-[0_4px_32px_rgba(0,0,0,0.5)]"
            />
            <Reveal delay={260}>
              <p className="font-headline-md text-[17px] md:text-[20px] text-white/85 max-w-md mt-8">
                Small plates and signature mains composed for the rhythm of the night — order for
                collection or reserve the full table experience.
              </p>
            </Reveal>
            <Reveal delay={380}>
              <div className="mt-10 flex flex-wrap gap-4">
                <Magnetic>
                  <Link
                    href="#collect"
                    className="btn-ink inline-flex items-center gap-2 font-label-caps text-label-caps px-7 py-4"
                  >
                    Order for collection
                    <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                  </Link>
                </Magnetic>
                <Magnetic>
                  <Link
                    href="/reservations"
                    className="btn-primary inline-flex items-center font-label-caps text-label-caps px-7 py-4"
                  >
                    Reserve with dinner
                  </Link>
                </Magnetic>
              </div>
            </Reveal>
          </div>
        </section>

        <div className="relative z-10 bg-background">
          <div className="relative border-y border-outline-variant/25 py-8 overflow-hidden bg-surface-container-lowest">
            <ScrollMarquee
              text="Kitchen open until 23:00 · Chef's tasting, seven courses · Two hundred bins in the cellar · Collection nightly ·"
              className="font-headline-lg text-[28px] md:text-[44px] uppercase tracking-[0.08em] text-on-surface-variant/25 whitespace-nowrap"
            />
          </div>

          <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter">
            {courses.map((course, ci) => (
              <section
                key={course.no}
                id={course.title.toLowerCase().replace(/\s+/g, "-")}
                className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 py-16 md:py-28 border-b border-outline-variant/20 last:border-b-0"
              >
                <div className={`lg:col-span-5 ${ci % 2 === 1 ? "lg:order-2" : ""}`}>
                  <div className="sticky-media">
                    <Reveal variant={ci % 2 === 1 ? "right" : "left"}>
                      <MaskReveal>
                        <ImageHover className="relative aspect-[4/5] hairline-gold">
                          <Parallax className="h-full w-full" speed={0.1}>
                            <div
                              className="h-full w-full bg-cover bg-center"
                              style={{ backgroundImage: `url('${course.image}')` }}
                            />
                          </Parallax>
                        </ImageHover>
                      </MaskReveal>
                    </Reveal>
                    <Reveal delay={160}>
                      <p className="font-body-md text-body-md text-on-surface-variant mt-6 max-w-xs">
                        {course.note}
                      </p>
                    </Reveal>
                  </div>
                </div>

                <div className={`lg:col-span-7 ${ci % 2 === 1 ? "lg:order-1" : ""}`}>
                  <Reveal className="flex items-baseline gap-6 mb-5">
                    <span className="numeral font-display-lg text-[64px] md:text-[96px] leading-none text-primary/20">
                      {course.no}
                    </span>
                    <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg uppercase tracking-[0.04em]">
                      {course.title}
                    </h2>
                  </Reveal>

                  <DrawLine orientation="horizontal" className="mb-10 h-px w-full" />

                  <div className="flex flex-col">
                    {course.items.map((item, i) => (
                      <Reveal key={item.id} delay={i * 90}>
                        <article className="group py-7 border-b border-outline-variant/20 last:border-b-0">
                          <div className="flex items-baseline gap-4">
                            <h3 className="font-headline-md text-[24px] md:text-[28px] group-hover:text-primary transition-colors duration-400">
                              {item.name}
                            </h3>
                            {item.tag && (
                              <span className="shrink-0 px-2 py-0.5 border border-outline-variant/50 font-label-caps text-[10px] tracking-widest text-on-surface-variant">
                                {item.tag}
                              </span>
                            )}
                            <span
                              aria-hidden="true"
                              className="flex-1 border-b border-dotted border-outline-variant/40 -translate-y-1"
                            />
                            <span className="numeral font-price-display text-price-display text-primary shrink-0">
                              {formatPrice(item.price_pence, item.currency)}
                            </span>
                          </div>
                          <p className="font-body-md text-body-md text-on-surface-variant mt-2 max-w-xl">
                            {item.description}
                          </p>
                        </article>
                      </Reveal>
                    ))}
                  </div>
                </div>
              </section>
            ))}
          </div>

          <FoodCollectionCart items={items} />

          <ConversionBand
            eyebrow="The kitchen is ready"
            title="Book the table, we'll handle the rest"
            body="Tell us the occasion and our team will shape the evening around it — from the first pour to the last course."
          />
        </div>
        <BrandCloser />
      </main>
      <FooterFlyover>
        <Footer />
      </FooterFlyover>
    </>
  );
}
