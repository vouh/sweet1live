"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { passwordIssues } from "@/lib/passwordPolicy";
import {
  getStaffSession,
  staffConfirmPasswordChange,
  staffDisplayRole,
  staffRequestPasswordChange,
  type StaffUser,
} from "@/lib/staffAuth";

type Step = "form" | "code";

export default function AdminProfilePage() {
  const [staff, setStaff] = useState<StaffUser | null>(null);
  const [step, setStep] = useState<Step>("form");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setStaff(getStaffSession());
  }, []);

  const issues = useMemo(() => passwordIssues(newPassword), [newPassword]);

  function resetFlow() {
    setStep("form");
    setNewPassword("");
    setConfirmPassword("");
    setCode("");
    setError("");
    setInfo("");
  }

  async function onRequestCode(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (issues.length > 0) {
      setError("Choose a stronger password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setPending(true);
    try {
      await staffRequestPasswordChange(newPassword);
      setInfo("A 6-digit code has been sent to your email. It expires in 5 minutes.");
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start password change.");
    } finally {
      setPending(false);
    }
  }

  async function onConfirmCode(e: FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      await staffConfirmPasswordChange(code);
      setInfo("Password updated. Use it next time you sign in.");
      setStep("form");
      setNewPassword("");
      setConfirmPassword("");
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not confirm that code.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div className="admin-panel p-8 md:p-10">
        <h2 className="font-headline-lg text-[28px] md:text-[34px] leading-tight">My Profile</h2>
        <p className="font-body-md text-[var(--admin-muted)] mt-3">
          Your staff account details for Sweet1ne Live.
        </p>
        <dl className="mt-8 space-y-5">
          <div>
            <dt className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-muted)]">
              Name
            </dt>
            <dd className="mt-1.5 text-[var(--admin-ink)]">{staff?.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-muted)]">
              Email
            </dt>
            <dd className="mt-1.5 text-[var(--admin-ink)]">{staff?.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[var(--admin-muted)]">
              Role
            </dt>
            <dd className="mt-1.5 text-[var(--admin-ink)]">
              {staff ? staffDisplayRole(staff) : "—"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="admin-panel p-8 md:p-10">
        <h3 className="font-headline-md text-[22px]">Change password</h3>
        <p className="font-body-md text-sm text-[var(--admin-muted)] mt-2">
          For your security, changing your password requires confirming a code sent to your
          email — that way a session left open on a shared device can&apos;t be used to lock you
          out.
        </p>

        {error && <p className="text-sm text-rose-600 mt-4">{error}</p>}
        {info && <p className="text-sm text-[var(--admin-muted)] mt-4">{info}</p>}

        {step === "form" ? (
          <form onSubmit={onRequestCode} className="flex flex-col gap-4 mt-5">
            <label className="block">
              <span className="admin-label">New password</span>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="admin-field mt-1 w-full"
              />
            </label>
            <label className="block">
              <span className="admin-label">Confirm new password</span>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="admin-field mt-1 w-full"
              />
            </label>
            {newPassword && issues.length > 0 ? (
              <ul className="text-xs text-[var(--admin-muted)] list-disc pl-5 space-y-1">
                {issues.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[var(--admin-muted)]">
                At least 8 characters, with an uppercase letter, a lowercase letter, a number, and
                a symbol.
              </p>
            )}
            <button type="submit" disabled={pending} className="admin-btn-primary self-start">
              {pending ? "Sending code…" : "Send confirmation code"}
            </button>
          </form>
        ) : (
          <form onSubmit={onConfirmCode} className="flex flex-col gap-4 mt-5">
            <label className="block">
              <span className="admin-label">6-digit code</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="admin-field mt-1 w-full tracking-[0.3em]"
                placeholder="123456"
              />
            </label>
            <div className="flex items-center gap-3">
              <button type="submit" disabled={pending} className="admin-btn-primary">
                {pending ? "Confirming…" : "Confirm and update password"}
              </button>
              <button type="button" onClick={resetFlow} className="admin-btn-ghost">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
