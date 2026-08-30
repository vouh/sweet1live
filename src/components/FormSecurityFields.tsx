"use client";

import { FORM_SECURITY_FIELD, formSecurityTimestamp } from "@/lib/formSecurity";
import { useState } from "react";

type Props = {
  /** Optional Turnstile token — wire up when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set. */
  turnstileToken?: string;
};

/**
 * Hidden honeypot + render timestamp for public enquiry forms.
 * Bots that auto-fill every field hit the honeypot; instant submits fail timing checks.
 */
export default function FormSecurityFields({ turnstileToken }: Props) {
  const [ts] = useState(() => formSecurityTimestamp());

  return (
    <>
      <input
        type="text"
        name={FORM_SECURITY_FIELD.honeypot}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute opacity-0 pointer-events-none h-0 w-0 overflow-hidden"
        style={{ position: "absolute", left: "-9999px" }}
      />
      <input type="hidden" name={FORM_SECURITY_FIELD.timestamp} value={ts} readOnly />
      {turnstileToken ? (
        <input type="hidden" name={FORM_SECURITY_FIELD.turnstile} value={turnstileToken} readOnly />
      ) : null}
    </>
  );
}
