import { NextResponse } from "next/server";
import {
  adminAuthConfigured,
  adminSessionCookieOptions,
  clearAdminSessionCookie,
  createAdminSessionToken,
  getAdminSessionUser,
  isAdminAuthenticated,
} from "@/lib/admin-auth";
import { authenticateAdminUser, ensureBootstrapAdmin } from "@/lib/admin-users";

export async function GET() {
  await ensureBootstrapAdmin();
  const user = await getAdminSessionUser();
  return NextResponse.json({
    ok: true,
    authenticated: await isAdminAuthenticated(),
    configured: adminAuthConfigured(),
    user,
  });
}

export async function POST(req: Request) {
  if (!adminAuthConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Admin auth needs ADMIN_PANEL_SECRET (session signing) and MONGODB_URI.",
      },
      { status: 503 },
    );
  }

  await ensureBootstrapAdmin();

  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };

  const result = await authenticateAdminUser(body.email ?? "", body.password ?? "");
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, user: result.user });
  const cookie = adminSessionCookieOptions(createAdminSessionToken(result.user._id));
  res.cookies.set(cookie.name, cookie.value, cookie);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  const cookie = clearAdminSessionCookie();
  res.cookies.set(cookie.name, cookie.value, cookie);
  return res;
}
