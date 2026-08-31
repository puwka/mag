"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    search.get("error") === "forbidden"
      ? "Нет доступа к админке. Нужна роль manager или admin."
      : null
  );
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const sb = createClient();
    const { error: authErr } = await sb.auth.signInWithPassword({
      email,
      password,
    });
    if (authErr) {
      setError(authErr.message);
      setPending(false);
      return;
    }
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) {
      setError("Не удалось получить сессию");
      setPending(false);
      return;
    }
    const { data: profile } = await sb
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .maybeSingle();
    if (
      !profile?.is_active ||
      (profile.role !== "admin" && profile.role !== "manager")
    ) {
      await sb.auth.signOut();
      setError("Нет доступа: роль не staff");
      setPending(false);
      return;
    }
    const next = search.get("next") || "/admin/";
    router.push(next);
    router.refresh();
  }

  return (
    <form className="admin-form" onSubmit={onSubmit}>
      <div className="admin-field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="admin-field">
        <label htmlFor="password">Пароль</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error ? <p className="admin-error">{error}</p> : null}
      <button type="submit" className="admin-btn admin-btn--primary" disabled={pending}>
        {pending ? "Вход…" : "Войти"}
      </button>
    </form>
  );
}
