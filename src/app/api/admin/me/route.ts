import { NextResponse } from "next/server";
import { getAdminSessionUser, invalidateAdminSessionUser } from "@/lib/admin-auth";
import { changeOwnPassword, updateOwnProfile } from "@/lib/admin-users";

export async function GET() {
  const me = await getAdminSessionUser();
  if (!me) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ ok: true, me });
}

export async function PATCH(req: Request) {
  const me = await getAdminSessionUser();
  if (!me) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    currentPassword?: string;
    newPassword?: string;
  };

  if (typeof body.newPassword === "string") {
    const result = await changeOwnPassword(
      me._id,
      body.currentPassword ?? "",
      body.newPassword,
    );
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }
    invalidateAdminSessionUser(me._id);
    return NextResponse.json({ ok: true });
  }

  if (typeof body.name === "string") {
    const result = await updateOwnProfile(me._id, body.name);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }
    invalidateAdminSessionUser(me._id);
    return NextResponse.json({ ok: true, me: result.user });
  }

  return NextResponse.json({ ok: false, error: "Nothing to update." }, { status: 400 });
}
