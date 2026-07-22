"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { COOKIE, createToken, verifyToken, verifyPassword } from "@/lib/auth";
import { serviceClient } from "@/lib/supabase/server";
import { LIMITS } from "@/lib/risk-profiles";

export interface FormState {
  ok?: boolean;
  error?: string;
}

function secret() {
  return process.env.ADMIN_SESSION_SECRET ?? "";
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  const ok = await verifyPassword(secret(), process.env.ADMIN_PASSWORD ?? "", password);
  if (!ok) return { error: "Feil passord." };

  const token = await createToken(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect("/admin");
}

export async function logout(): Promise<void> {
  (await cookies()).set(COOKIE, "", { path: "/", maxAge: 0 });
  redirect("/admin/login");
}

const clamp = (n: number, [lo, hi]: readonly [number, number]) =>
  Math.min(hi, Math.max(lo, n));

export async function saveConfig(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!(await verifyToken(secret(), token))) return { error: "Ikke innlogget." };

  const pairs = formData.getAll("allowed_pairs").map(String).filter(Boolean);
  if (pairs.length === 0) return { error: "Minst ett par må være valgt (ellers kan ikke agenten handle)." };

  const patch = {
    kill_switch: formData.get("kill_switch") === "on",
    max_position_pct: clamp(Number(formData.get("max_position_pct")), LIMITS.max_position_pct),
    max_trades_per_day: Math.round(
      clamp(Number(formData.get("max_trades_per_day")), LIMITS.max_trades_per_day),
    ),
    cycle_hours: clamp(Number(formData.get("cycle_hours")), LIMITS.cycle_hours),
    min_order_usd: clamp(Number(formData.get("min_order_usd")), LIMITS.min_order_usd),
    allowed_pairs: pairs,
    updated_at: new Date().toISOString(),
  };

  const { error } = await serviceClient().from("trader_config").update(patch).eq("id", 1);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}
