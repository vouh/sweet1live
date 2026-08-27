"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthModal } from "@/components/AuthModalProvider";

/** Legacy route — opens the sign-in modal on the homepage. */
export default function SignInPage() {
  const router = useRouter();
  const { open } = useAuthModal();

  useEffect(() => {
    open("signin");
    router.replace("/");
  }, [open, router]);

  return null;
}
