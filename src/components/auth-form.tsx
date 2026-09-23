"use client";

import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import styles from "@/app/auth/auth.module.css";

export function AuthForm({ mode, googleConfigured, authError }: { mode: "login" | "signup"; googleConfigured: boolean; authError?: string }) {
  const router = useRouter();
  const signup = mode === "signup";
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(authError ?? "");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (signup && password !== String(form.get("confirmPassword") ?? "")) {
      setError("Your passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    const body = signup
      ? {
          displayName: form.get("displayName"),
          email: form.get("email"),
          jobTitle: form.get("jobTitle"),
          organizationName: form.get("organizationName"),
          password,
          acceptedTerms: form.get("acceptedTerms") === "on",
        }
      : { email: form.get("email"), password };
    try {
      const response = await fetch(`/api/auth/${signup ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as { error?: string; redirectTo?: string };
      if (!response.ok) throw new Error(payload.error ?? "Authentication failed.");
      router.push(payload.redirectTo ?? "/app");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authentication failed.");
      setBusy(false);
    }
  }

  return <form className={styles.form} onSubmit={submit}>
    {signup && <div className={styles.fieldRow}><label><span>Full name</span><div><UserRound size={16} /><input name="displayName" autoComplete="name" placeholder="Chidi Okoro" minLength={2} maxLength={100} required /></div></label><label><span>Your role</span><div><BriefcaseBusiness size={16} /><input name="jobTitle" autoComplete="organization-title" placeholder="Founder, operator…" minLength={2} maxLength={100} required /></div></label></div>}
    {signup && <label><span>Workspace name</span><div><Building2 size={16} /><input name="organizationName" autoComplete="organization" placeholder="Vexa Labs" minLength={2} maxLength={120} required /></div><small>Your private command center. You can invite a team later.</small></label>}
    <label><span>Work email</span><div><Mail size={16} /><input name="email" type="email" autoComplete="email" placeholder="you@company.com" maxLength={254} required /></div></label>
    <label><span>Password</span><div><LockKeyhole size={16} /><input name="password" type={showPassword ? "text" : "password"} autoComplete={signup ? "new-password" : "current-password"} placeholder={signup ? "12+ characters" : "Your password"} minLength={signup ? 12 : 1} maxLength={128} required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button></div>{signup && <small>Use 12+ characters with uppercase, lowercase, and a number.</small>}</label>
    {signup && <label><span>Confirm password</span><div><LockKeyhole size={16} /><input name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Repeat your password" minLength={12} maxLength={128} required /></div></label>}
    {signup && <label className={styles.consent}><input name="acceptedTerms" type="checkbox" required /><span><Check size={11} />I agree to the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Notice</Link>.</span></label>}
    {error && <div className={styles.error} role="alert"><ShieldCheck size={15} /><span>{error}</span></div>}
    <button className={styles.submit} type="submit" disabled={busy}>{busy ? <><Sparkles className={styles.spin} size={16} />{signup ? "Creating your workspace…" : "Opening your workspace…"}</> : <>{signup ? "Create my workspace" : "Log in to Vexa"}<ArrowRight size={16} /></>}</button>
    <div className={styles.divider}><span>or continue with</span></div>
    {googleConfigured ? <a className={styles.google} href="/api/auth/google/start?returnTo=/app"><span>G</span>Continue with Google</a> : <button className={styles.google} type="button" disabled title="Google OAuth credentials are not configured yet"><span>G</span>Google sign-in available after setup</button>}
    <p className={styles.switch}>{signup ? "Already have a workspace?" : "New to Vexa?"} <Link href={signup ? "/login" : "/signup"}>{signup ? "Log in" : "Create one"}</Link></p>
  </form>;
}
