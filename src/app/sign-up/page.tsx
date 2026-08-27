"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthModal } from "@/components/AuthModalProvider";

/** Legacy route — opens the create-account modal on the homepage. */
export default function SignUpPage() {
  const router = useRouter();
  const { open } = useAuthModal();

  useEffect(() => {
    open("signup");
    router.replace("/");
  }, [open, router]);

  return null;
}
