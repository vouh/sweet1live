"use client";

import CinematicScrollStage from "@/components/motion/CinematicScrollStage";
import { DEFAULT_LIFESTYLE } from "@/lib/images";

type SlideWavePanelProps = {
  imageSrc?: string;
  panelEyebrow?: string;
  panelTitle?: string;
  panelBody?: string;
  panelPrimaryHref?: string;
  panelPrimaryLabel?: string;
  panelSecondaryHref?: string;
  panelSecondaryLabel?: string;
};

/** Events dinner block — resolve frame of the cinematic scroll stage. */
export default function SlideWavePanel({
  imageSrc = DEFAULT_LIFESTYLE,
  ...rest
}: SlideWavePanelProps) {
  return <CinematicScrollStage imageSrc={imageSrc} {...rest} />;
}
