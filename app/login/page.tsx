"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");
    const supabase = getSupabaseBrowser();

    if (mode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset`,
      });
      if (error) {
        setError(error.message);
      } else {
        setInfo("Check your email for a password reset link.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push("/");
        router.refresh();
      }
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 p-8 border border-white/10 rounded-lg">
        <h1 className="text-xl font-semibold">
          {mode === "signin" ? "Sign in" : "Reset password"}
        </h1>
        <p className="text-sm text-white/40">
          {mode === "signin" ? "Authorized users only" : "Enter your email to receive a reset link"}
        </p>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoFocus
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded outline-none focus:border-white/30"
        />

        {mode === "signin" && (
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
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
          {loading ? "..." : mode === "signin" ? "Sign in" : "Send reset link"}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "reset" : "signin");
            setError("");
            setInfo("");
          }}
          className="w-full text-sm text-white/60 hover:text-white"
        >
          {mode === "signin" ? "Forgot password?" : "Back to sign in"}
        </button>
      </form>
    </div>
  );
}
