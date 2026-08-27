"use client";

import type { ReactNode } from "react";

/** Legacy wrapper — Events now uses CinematicScrollStage. */
export default function ScrollPanelReveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}
