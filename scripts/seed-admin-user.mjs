/**
 * Seeds / resets the bootstrap admin in MongoDB and prints credentials.
 * Usage: node scripts/seed-admin-user.mjs
 */
import { readFileSync } from "fs";
import { createRequire } from "module";
import path from "path";

const root = process.cwd();

try {
  for (const line of readFileSync(path.join(root, ".env"), "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
} catch {
  /* optional */
}

const require = createRequire(import.meta.url);
const { MongoClient, ObjectId } = require("mongodb");
const { randomBytes, scryptSync } = require("crypto");

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const email = (process.env.ADMIN_BOOTSTRAP_EMAIL || process.env.ADMIN_EMAIL || "admin@reelpermit.local")
  .trim()
  .toLowerCase();
const password =
  process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim() ||
  `Ap-${randomBytes(9).toString("base64url").slice(0, 12)}`;
const uri = process.env.MONGODB_URI?.trim();

if (!uri || uri === "memory") {
  console.error("Set MONGODB_URI to your Atlas connection string (not memory) to seed a real user.");
  process.exit(1);
}

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 12_000,
  connectTimeoutMS: 12_000,
});

try {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB?.trim() || "reelpermit");
  const col = db.collection("admin_users");
  const existing = await col.findOne({ email });
  const t = new Date().toISOString();
  if (existing) {
    await col.updateOne(
      { _id: existing._id },
      {
        $set: {
          passwordHash: hashPassword(password),
          role: "admin",
          status: "active",
          activatedAt: existing.activatedAt || t,
          updatedAt: t,
          name: existing.name || "Primary Admin",
        },
      },
    );
    console.log("Updated existing admin user.");
  } else {
    await col.insertOne({
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
    });
    console.log("Created admin user.");
  }
  const login = `${(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "")}/cpanel/admin/login`;
  console.log("");
  console.log("=== Admin login credentials ===");
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Login:    ${login}`);
  console.log("================================");
  await client.close();
} catch (err) {
  console.error("Seed failed:", err.message);
  console.error("Fix Atlas Network Access (allow your IP or 0.0.0.0/0), then re-run.");
  process.exit(1);
}
