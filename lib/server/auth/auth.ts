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
      // Better Auth admin endpoints (createUser, listUsers, setRole,
      // removeUser, setUserPassword) require an HTTP-request caller with a
      // session whose `role` is in `adminRoles`. Server-side API calls
      // (auth.api.* without headers) bypass this check — the admin plugin
      // only enforces when there's a request+session. Our user-management
      // Server Actions use auth.api.* server-side; our application-level
      // authorization (can()/requireCapability() reading principalType)
      // is the actual security authority for user:* capabilities.
      // adminRoles stays at the default ["admin"] — we don't grant any
      // JOURDAIN user the Better Auth "admin" role; we use our own
      // principalType hierarchy (ADMIN / SUPER_ADMIN / FANTOMAS).
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
  baseURL: {
    allowedHosts: [
      "localhost",
      "localhost:*",
      "127.0.0.1",
      "127.0.0.1:*",
      "jourdain-three.vercel.app",
      "jourdain-*.vercel.app",
    ],
    fallback: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    protocol: "auto",
  },
  advanced: {
    // The __Secure- cookie prefix requires HTTPS. With protocol:"auto" and
    // NODE_ENV=production, Better Auth defaults to __Secure- which breaks
    // HTTP local dev / E2E. When an explicitly configured BETTER_AUTH_URL
    // begins with http://, we know we're on HTTP → useSecureCookies = false.
    // Otherwise (Vercel HTTPS, no BETTER_AUTH_URL, or https:// URL), preserve
    // Better Auth's normal/default secure-cookie behavior.
    useSecureCookies: process.env.BETTER_AUTH_URL?.startsWith("http://") ? false : undefined,
  },
});

export type Auth = typeof auth;
