"use client";

import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Side-enter page transition — new route slides in from the left.
 * Mounted via app/template.tsx so it remounts on each navigation.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ x: "-12%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen flex flex-col flex-grow"
    >
      {children}
    </motion.div>
  );
}
