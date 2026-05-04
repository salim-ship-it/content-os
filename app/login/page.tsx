"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type Mode = "signin" | "signup" | "reset";

const TITLES: Record<Mode, string> = {
  signin: "Sign in",
  signup: "Create your account",
  reset: "Reset password",
};

const SUBTITLES: Record<Mode, string> = {
  signin: "Welcome back to Content OS.",
  signup: "Pick creators, train your voice, ship daily.",
  reset: "Enter your email to receive a reset link.",
};

const SUBMIT_LABELS: Record<Mode, string> = {
  signin: "Sign in",
  signup: "Create account",
  reset: "Send reset link",
};

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setInfo("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");
    const supabase = getSupabaseBrowser();

    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset`,
        });
        if (error) setError(error.message);
        else setInfo("Check your email for a password reset link.");
      } else if (mode === "signup") {
        if (password !== confirm) {
          setError("Passwords don't match.");
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding/creators`,
          },
        });
        if (error) {
          setError(error.message);
        } else if (data.session) {
          router.push("/");
          router.refresh();
        } else {
          setInfo(
            "Account created. Check your email to confirm, then sign in here."
          );
          setMode("signin");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError(error.message);
        else {
          router.push("/");
          router.refresh();
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 p-8 border border-white/10 rounded-lg">
        <h1 className="text-xl font-semibold">{TITLES[mode]}</h1>
        <p className="text-sm text-white/40">{SUBTITLES[mode]}</p>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoFocus
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded outline-none focus:border-white/30"
        />

        {mode !== "reset" && (
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "signup" ? "Choose a password (min 6)" : "Password"}
            required
            minLength={6}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded outline-none focus:border-white/30"
          />
        )}

        {mode === "signup" && (
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm password"
            required
            minLength={6}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded outline-none focus:border-white/30"
          />
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}
        {info && <p className="text-sm text-green-400">{info}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-white text-black rounded font-medium disabled:opacity-50"
        >
          {loading ? "..." : SUBMIT_LABELS[mode]}
        </button>

        <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
          {mode === "signin" && (
            <>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className="text-sm text-white/60 hover:text-white"
              >
                Don&apos;t have an account? <span className="underline">Create one</span>
              </button>
              <button
                type="button"
                onClick={() => switchMode("reset")}
                className="text-sm text-white/40 hover:text-white"
              >
                Forgot password?
              </button>
            </>
          )}
          {mode === "signup" && (
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className="text-sm text-white/60 hover:text-white"
            >
              Already have an account? <span className="underline">Sign in</span>
            </button>
          )}
          {mode === "reset" && (
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className="text-sm text-white/60 hover:text-white"
            >
              Back to sign in
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
