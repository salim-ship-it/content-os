"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    setError("");

    const supabase = getSupabaseBrowser();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      router.push("/");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 p-8 border border-white/10 rounded-lg">
        <h1 className="text-xl font-semibold">Set your password</h1>
        <p className="text-sm text-white/40">Choose a password for your account</p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          required
          minLength={6}
          autoFocus
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded outline-none focus:border-white/30"
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm password"
          required
          minLength={6}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded outline-none focus:border-white/30"
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-white text-black rounded font-medium disabled:opacity-50"
        >
          {loading ? "..." : "Set password"}
        </button>
      </form>
    </div>
  );
}
