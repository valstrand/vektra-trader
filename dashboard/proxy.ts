import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE, verifyToken } from "@/lib/auth";

// Beskytter /admin/* — untatt /admin/login. Selve skrivingen ligger uansett i
// server actions, så en forbigått gate lekker aldri service role.
export async function proxy(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/admin/login")) return NextResponse.next();

  const token = req.cookies.get(COOKIE)?.value;
  const ok = await verifyToken(process.env.ADMIN_SESSION_SECRET ?? "", token);
  if (!ok) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
