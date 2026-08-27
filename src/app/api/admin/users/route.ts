import { NextResponse } from "next/server";
import { getAdminSessionUser } from "@/lib/admin-auth";
import {
  deleteAdminUser,
  inviteAdminUser,
  listAdminUsers,
  type AdminUserRole,
} from "@/lib/admin-users";

export async function GET() {
  const me = await getAdminSessionUser();
  if (!me) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const users = await listAdminUsers();
  return NextResponse.json({ ok: true, users, me });
}

export async function POST(req: Request) {
  const me = await getAdminSessionUser();
  if (!me) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Only admins can invite users." }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    name?: string;
    role?: AdminUserRole;
  };

  const result = await inviteAdminUser({
    email: body.email ?? "",
    name: body.name,
    role: body.role,
    invitedBy: me._id,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    user: result.user,
    emailDelivered: result.emailDelivered,
    emailError: result.emailError,
    // Return temp password in API so admin can copy if email fails (Resend sandbox).
    temporaryPassword: result.password,
  });
}

export async function DELETE(req: Request) {
  const me = await getAdminSessionUser();
  if (!me) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Only admins can delete users." }, { status: 403 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id")?.trim() || "";
  if (!id) {
    return NextResponse.json({ ok: false, error: "User id required." }, { status: 400 });
  }

  const result = await deleteAdminUser({
    actorId: me._id,
    actorRole: me.role,
    targetId: id,
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
