"use client";

import { useActionState } from "react";
import { login, type FormState } from "@/app/admin/actions";
import { Card } from "@/components/ui/Card";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(login, {});
  return (
    <div className="mx-auto max-w-sm py-12">
      <Card>
        <h1 className="mb-1 text-lg font-semibold tracking-tight">Admin</h1>
        <p className="mb-4 text-sm text-muted">Logg inn for å styre risikoprofil og kill switch.</p>
        <form action={formAction} className="space-y-3">
          <input
            type="password"
            name="password"
            placeholder="Passord"
            autoComplete="current-password"
            className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-fg outline-none focus:border-accent"
          />
          {state.error && <p className="text-sm text-negative">{state.error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-accent px-3 py-2 font-medium text-bg disabled:opacity-60"
          >
            {pending ? "Logger inn…" : "Logg inn"}
          </button>
        </form>
      </Card>
    </div>
  );
}
