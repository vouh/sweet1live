"use client";

import LazyBackground from "@/components/LazyBackground";
import ImageHover from "@/components/motion/ImageHover";

/** Lazy-loaded photo tile for horizontal gallery strips. */
export default function StripPhoto({ src }: { src: string }) {
  return (
    <ImageHover className="absolute inset-0" strength={10}>
      <LazyBackground src={src} className="absolute inset-0 bg-cover bg-center" />
    </ImageHover>
  );
}
