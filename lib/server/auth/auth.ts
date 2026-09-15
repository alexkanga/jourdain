import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { admin } from "better-auth/plugins";
import { db } from "@/db/index";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
      rateLimit: schema.rateLimit,
    },
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  plugins: [
    username(),
    admin({
      defaultRole: "user",
    }),
  ],
  user: {
    additionalFields: {
      principalType: {
        type: "string",
        required: true,
        defaultValue: "ADMIN",
        input: false, // Server-owned — client can NEVER set or modify
        returned: true, // Included in session/API responses
      },
    },
  },
  rateLimit: {
    enabled: true, // Explicitly enabled — not relying on development-mode default
    storage: "database", // Database-backed on Neon — NOT memory fallback
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
});

export type Auth = typeof auth;
