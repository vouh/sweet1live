type HeroVideoProps = {
  src: string;
  poster?: string;
};

/** Full-bleed hero — light preload so the page paints before the MP4 finishes. */
export default function HeroVideo({ src, poster }: HeroVideoProps) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <video
        className="hero-video absolute inset-0 h-full w-full object-cover object-center hero-media"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={poster}
        aria-hidden
      >
        <source src={src} type="video/mp4" />
      </video>
      <div className="hero-media-veil pointer-events-none absolute inset-0" aria-hidden />
    </div>
  );
}
