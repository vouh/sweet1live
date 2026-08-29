type HeroVideoProps = {
  src: string;
};

/** Full-bleed hero — object-cover fills the section; proportions stay true (edges may crop). */
export default function HeroVideo({ src }: HeroVideoProps) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <video
        className="hero-video absolute inset-0 h-full w-full object-cover object-center hero-media"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
      >
        <source src={src} type="video/mp4" />
      </video>
      <div className="hero-media-veil pointer-events-none absolute inset-0" aria-hidden />
    </div>
  );
}
