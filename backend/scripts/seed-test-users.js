// seed-test-users.js — Creates test accounts for each dashboard role.
// Run: node scripts/seed-test-users.js
//
// Creates Clerk users + MongoDB records with the correct roles.
// Safe to run multiple times (idempotent).

import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const CLERK_SECRET = process.env.CLERK_SECRET_KEY;
const CLERK_BASE = "https://api.clerk.com/v1";

const clerkHeaders = {
  Authorization: `Bearer ${CLERK_SECRET}`,
  "Content-Type": "application/json",
};

const clerkPost = async (path, body) => {
  const res = await fetch(`${CLERK_BASE}${path}`, {
    method: "POST",
    headers: clerkHeaders,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Clerk ${res.status}: ${JSON.stringify(err.errors || err)}`);
  }
  return res.json();
};

const clerkPatch = async (path, body) => {
  const res = await fetch(`${CLERK_BASE}${path}`, {
    method: "PATCH",
    headers: clerkHeaders,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Clerk ${res.status}: ${JSON.stringify(err.errors || err)}`);
  }
  return res.json();
};

const clerkGet = async (path) => {
  const res = await fetch(`${CLERK_BASE}${path}`, { headers: clerkHeaders });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Clerk ${res.status}: ${JSON.stringify(err.errors || err)}`);
  }
  return res.json();
};

const TEST_USERS = [
  {
    email: "manager@test.com",
    password: "H0telMGR#Secure2026!",
    firstName: "Hotel",
    lastName: "Manager",
    role: "hotel_manager",
    username: "hotel_manager",
  },
  {
    email: "receptionist@test.com",
    password: "R3cept!onDesk#2026!",
    firstName: "Desk",
    lastName: "Agent",
    role: "receptionist",
    username: "receptionist",
  },
  {
    email: "superadmin@test.com",
    password: "Sup3rAdm!n#Platform2026!",
    firstName: "Super",
    lastName: "Admin",
    role: "super_admin",
    username: "superadmin",
  },
];

const seed = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  await mongoose.connect(uri, { dbName: "SmartStayX" });
  console.log("Connected to MongoDB\n");

  for (const u of TEST_USERS) {
    try {
      let clerkUser = null;

      // 1. Find or create Clerk user
      try {
        const existing = await clerkGet(`/users?email_address=${encodeURIComponent(u.email)}`);
        clerkUser = existing.data?.[0] || null;
      } catch {}

      if (!clerkUser) {
        clerkUser = await clerkPost("/users", {
          email_address: [u.email],
          password: u.password,
          first_name: u.firstName,
          last_name: u.lastName,
          username: u.username,
          public_metadata: { role: u.role },
        });
        console.log(`  Created Clerk user: ${u.email}`);
      } else {
        await clerkPatch(`/users/${clerkUser.id}`, {
          public_metadata: { role: u.role },
        });
        console.log(`  Updated Clerk role: ${u.email} → ${u.role}`);
      }

      // 2. Upsert MongoDB user
      await User.findOneAndUpdate(
        { _id: clerkUser.id },
        {
          $set: {
            email: u.email,
            name: `${u.firstName} ${u.lastName}`,
            username: u.username,
            role: u.role,
            status: "active",
          },
        },
        { upsert: true, new: true }
      );

      console.log(`✓ ${u.email} (${u.role})`);
    } catch (err) {
      console.error(`✗ ${u.email} — ${err.message}`);
    }
  }

  console.log("\n=== Test Accounts ===\n");
  console.log("Login URL: http://localhost:5173/login\n");
  for (const u of TEST_USERS) {
    console.log(`  ${u.role.padEnd(16)} email: ${u.email.padEnd(24)} password: ${u.password}`);
  }
  console.log(`  ${"super_admin".padEnd(16)} email: mbmafrij@gmail.com          (auto via ADMIN_EMAILS)`);

  await mongoose.disconnect();
  console.log("\nDone.");
};

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
