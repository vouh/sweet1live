import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { emailHasAdminRole, normalizeStaffEmail } from "@/lib/staffRoles";

type Body = { email?: string };

/**
 * Staff password reset request.
 * Flow: validate email → require admin role → mint unique token → send via Resend.
 * Resend is wired when RESEND_API_KEY (+ RESEND_FROM) are set; otherwise we log the link for local testing.
 */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = normalizeStaffEmail(body.email ?? "");
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  // Always return a generic success for non-admin emails (no account enumeration).
  if (!emailHasAdminRole(email)) {
    return NextResponse.json({
      message: "An email with a reset link is on its way. Open it to choose a new password.",
    });
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  // Persist tokenHash + email + expiresAt in DB when auth is wired.
  void tokenHash;
  void expiresAt;

  const origin = new URL(request.url).origin;
  const resetUrl = `${origin}/admin/reset-password?token=${token}`;

  const sent = await sendResetEmailViaResend({ to: email, resetUrl });

  if (!sent.ok) {
    console.info("[admin/forgot-password] reset link (Resend not configured):", resetUrl);
  }

  return NextResponse.json({
    message: "An email with a reset link is on its way. Open it to choose a new password.",
  });
}

async function sendResetEmailViaResend(opts: {
  to: string;
  resetUrl: string;
}): Promise<{ ok: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "Sweet1ne Live <onboarding@resend.dev>";

  if (!apiKey) {
    return { ok: false };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: "Reset your Sweet1ne staff password",
        html: `
          <p>You asked to reset your Sweet1ne Live staff password.</p>
          <p><a href="${opts.resetUrl}">Reset password</a></p>
          <p>This link expires in 1 hour. If you didn’t request it, you can ignore this email.</p>
        `,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("[admin/forgot-password] Resend error:", detail);
      return { ok: false };
    }

    return { ok: true };
  } catch (err) {
    console.error("[admin/forgot-password] Resend failed:", err);
    return { ok: false };
  }
}
