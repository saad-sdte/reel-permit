import { ObjectId, type Collection } from "mongodb";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { getMongoDb, mongoConfigured } from "@/lib/mongo";
import { deliver } from "@/lib/email/pipeline";

export type AdminUserRole = "admin" | "user";
export type AdminUserStatus = "pending" | "active" | "disabled";

export interface AdminUserDoc {
  _id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  invitedBy: string | null;
  invitedAt: string | null;
  activatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PublicAdminUser = Omit<AdminUserDoc, "passwordHash">;

declare global {
  // eslint-disable-next-line no-var
  var __anglerAdminUsersMem: Map<string, AdminUserDoc> | undefined;
}

function mem() {
  if (!globalThis.__anglerAdminUsersMem) {
    globalThis.__anglerAdminUsersMem = new Map();
  }
  return globalThis.__anglerAdminUsersMem;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  try {
    const a = Buffer.from(hash, "hex");
    const b = scryptSync(password, salt, 64);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function generateTempPassword(): string {
  // Readable + strong enough for invite flow (user should change later).
  const raw = randomBytes(9).toString("base64url");
  return `Ap-${raw.slice(0, 12)}`;
}

function toPublic(u: AdminUserDoc): PublicAdminUser {
  const { passwordHash, ...rest } = u;
  void passwordHash;
  return rest;
}

async function usersCol(): Promise<Collection<AdminUserDoc> | null> {
  if (!mongoConfigured()) return null;
  const db = await getMongoDb();
  return db ? db.collection<AdminUserDoc>("admin_users") : null;
}

async function findByEmail(email: string): Promise<AdminUserDoc | null> {
  const e = normalizeEmail(email);
  const c = await usersCol();
  if (c) return c.findOne({ email: e });
  return Array.from(mem().values()).find((u) => u.email === e) ?? null;
}

async function findById(id: string): Promise<AdminUserDoc | null> {
  const c = await usersCol();
  if (c) return c.findOne({ _id: id });
  return mem().get(id) ?? null;
}

async function saveUser(doc: AdminUserDoc): Promise<void> {
  const c = await usersCol();
  if (c) {
    const { _id, ...rest } = doc;
    await c.updateOne({ _id }, { $set: rest, $setOnInsert: { _id } }, { upsert: true });
    return;
  }
  mem().set(doc._id, doc);
}

export async function listAdminUsers(): Promise<PublicAdminUser[]> {
  await ensureBootstrapAdmin();
  const c = await usersCol();
  if (c) {
    const rows = await c.find({}).sort({ createdAt: -1 }).toArray();
    return rows.map(toPublic);
  }
  return Array.from(mem().values())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(toPublic);
}

export async function authenticateAdminUser(
  email: string,
  password: string,
): Promise<{ ok: true; user: PublicAdminUser } | { ok: false; error: string }> {
  await ensureBootstrapAdmin();
  const user = await findByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { ok: false, error: "Invalid email or password." };
  }
  if (user.status === "disabled") {
    return { ok: false, error: "This account is disabled." };
  }

  if (user.status === "pending") {
    const updated: AdminUserDoc = {
      ...user,
      status: "active",
      activatedAt: nowIso(),
      updatedAt: nowIso(),
    };
    await saveUser(updated);
    return { ok: true, user: toPublic(updated) };
  }

  return { ok: true, user: toPublic(user) };
}

export async function getAdminUserById(id: string): Promise<PublicAdminUser | null> {
  const u = await findById(id);
  return u ? toPublic(u) : null;
}

export async function updateOwnProfile(
  userId: string,
  name: string,
): Promise<{ ok: true; user: PublicAdminUser } | { ok: false; error: string }> {
  const trimmed = name.trim();
  if (trimmed.length < 2) return { ok: false, error: "Name must be at least 2 characters." };
  if (trimmed.length > 80) return { ok: false, error: "Name is too long." };
  const user = await findById(userId);
  if (!user) return { ok: false, error: "User not found." };
  const updated: AdminUserDoc = { ...user, name: trimmed, updatedAt: nowIso() };
  await saveUser(updated);
  return { ok: true, user: toPublic(updated) };
}

export async function changeOwnPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (newPassword.trim().length < 8) {
    return { ok: false, error: "New password must be at least 8 characters." };
  }
  if (currentPassword === newPassword) {
    return { ok: false, error: "New password must be different from the current one." };
  }
  const user = await findById(userId);
  if (!user) return { ok: false, error: "User not found." };
  if (!verifyPassword(currentPassword, user.passwordHash)) {
    return { ok: false, error: "Current password is incorrect." };
  }
  const updated: AdminUserDoc = {
    ...user,
    passwordHash: hashPassword(newPassword),
    updatedAt: nowIso(),
  };
  await saveUser(updated);
  return { ok: true };
}

/**
 * Admin may delete lower-ranked teammates (role=user) only.
 * Cannot delete self, other admins, or the last admin.
 */
export async function deleteAdminUser(input: {
  actorId: string;
  actorRole: AdminUserRole;
  targetId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.actorRole !== "admin") {
    return { ok: false, error: "Only admins can delete users." };
  }
  if (input.actorId === input.targetId) {
    return { ok: false, error: "You cannot delete your own account." };
  }
  const target = await findById(input.targetId);
  if (!target) return { ok: false, error: "User not found." };
  if (target.role === "admin") {
    return { ok: false, error: "Admins cannot delete other admins." };
  }

  const c = await usersCol();
  if (c) {
    await c.deleteOne({ _id: target._id });
  } else {
    mem().delete(target._id);
  }
  return { ok: true };
}

export async function inviteAdminUser(input: {
  email: string;
  name?: string;
  role?: AdminUserRole;
  invitedBy: string;
}): Promise<
  | { ok: true; user: PublicAdminUser; password: string; emailDelivered: boolean; emailError?: string }
  | { ok: false; error: string }
> {
  await ensureBootstrapAdmin();
  const email = normalizeEmail(input.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  const existing = await findByEmail(email);
  if (existing) return { ok: false, error: "A user with that email already exists." };

  const password = generateTempPassword();
  const t = nowIso();
  const doc: AdminUserDoc = {
    _id: new ObjectId().toHexString(),
    email,
    name: (input.name || email.split("@")[0] || "Teammate").trim(),
    passwordHash: hashPassword(password),
    role: input.role === "admin" ? "admin" : "user",
    status: "pending",
    invitedBy: input.invitedBy,
    invitedAt: t,
    activatedAt: null,
    createdAt: t,
    updatedAt: t,
  };
  await saveUser(doc);

  const mail = await sendInviteEmail({
    to: email,
    name: doc.name,
    password,
  });

  return {
    ok: true,
    user: toPublic(doc),
    password,
    emailDelivered: mail.delivered,
    emailError: mail.error,
  };
}

async function sendInviteEmail(args: {
  to: string;
  name: string;
  password: string;
}): Promise<{ delivered: boolean; error?: string }> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const loginUrl = `${base}/admin/login`;
  const from =
    process.env.EMAIL_FROM_SUPPORT ||
    process.env.EMAIL_FROM ||
    "ReelPermit <onboarding@resend.dev>";

  const text = [
    `Hi ${args.name},`,
    ``,
    `You've been invited to the ReelPermit ops console.`,
    ``,
    `Login URL: ${loginUrl}`,
    `Email: ${args.to}`,
    `Temporary password: ${args.password}`,
    ``,
    `Sign in once to activate your account (status moves from pending → active).`,
    ``,
    `— ReelPermit`,
  ].join("\n");

  const html = `
    <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0b1f2a">
      <h1 style="font-size:20px;margin:0 0 12px">You're invited to ReelPermit Ops</h1>
      <p style="margin:0 0 16px;color:#5c7380">Hi ${escapeHtml(args.name)}, use the credentials below to sign in.</p>
      <p style="margin:0 0 8px"><strong>Login URL</strong><br/><a href="${loginUrl}">${loginUrl}</a></p>
      <p style="margin:0 0 8px"><strong>Email</strong><br/>${escapeHtml(args.to)}</p>
      <p style="margin:0 0 16px"><strong>Temporary password</strong><br/><code style="font-size:16px;background:#f3efe6;padding:6px 10px;border-radius:8px">${escapeHtml(args.password)}</code></p>
      <p style="margin:0;color:#5c7380;font-size:13px">Your account starts as <em>pending</em> and becomes <em>active</em> after your first successful login.</p>
    </div>
  `;

  return deliver({
    from,
    to: args.to,
    subject: "Your ReelPermit admin login",
    html,
    text,
    tag: "admin-invite",
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Ensures a bootstrap admin exists. Returns credentials when a NEW user was created.
 */
export async function ensureBootstrapAdmin(): Promise<{
  created: boolean;
  email: string;
  password?: string;
  backend: "mongo" | "memory";
} | null> {
  if (!mongoConfigured()) return null;

  const c = await usersCol();
  const backend: "mongo" | "memory" = c ? "mongo" : "memory";

  const count = c ? await c.countDocuments() : mem().size;
  if (count > 0) {
    return { created: false, email: "", backend };
  }

  const email = normalizeEmail(
    process.env.ADMIN_BOOTSTRAP_EMAIL ||
      process.env.ADMIN_EMAIL ||
      "admin@reelpermit.local",
  );
  const password =
    process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim() || generateTempPassword();

  const t = nowIso();
  const doc: AdminUserDoc = {
    _id: new ObjectId().toHexString(),
    email,
    name: "Primary Admin",
    passwordHash: hashPassword(password),
    role: "admin",
    status: "active",
    invitedBy: null,
    invitedAt: null,
    activatedAt: t,
    createdAt: t,
    updatedAt: t,
  };
  await saveUser(doc);

  // eslint-disable-next-line no-console
  console.log(
    `[admin-users] Bootstrap admin created (${backend})\n  email: ${email}\n  password: ${password}`,
  );

  return { created: true, email, password, backend };
}
