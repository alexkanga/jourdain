import { auth } from "@/lib/server/auth/auth";
import { db } from "@/db/index";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Idempotent bootstrap script for JOURDAIN EMPLOI system principals.
 *
 * Creates Fantomas (principalType=FANTOMAS) and initial ADMIN (principalType=ADMIN)
 * if they do not already exist. Does NOT overwrite existing users.
 *
 * Usage: pnpm db:bootstrap
 *
 * Required env vars:
 * - FANTOMAS_INITIAL_PASSWORD
 * - INITIAL_ADMIN_LOGIN (optional, default: "admin1")
 * - INITIAL_ADMIN_PASSWORD
 * - INITIAL_ADMIN_EMAIL (optional, default: derived from login)
 * - FANTOMAS_EMAIL (optional, default: "fantomas@jourdain.local")
 */

const FANTOMAS_USERNAME = "Fantomas";
const FANTOMAS_EMAIL = process.env.FANTOMAS_EMAIL || "fantomas@jourdain.local";
const FANTOMAS_PASSWORD = process.env.FANTOMAS_INITIAL_PASSWORD;

const ADMIN_LOGIN = process.env.INITIAL_ADMIN_LOGIN || "admin1";
const ADMIN_PASSWORD = process.env.INITIAL_ADMIN_PASSWORD;
const ADMIN_EMAIL = process.env.INITIAL_ADMIN_EMAIL || `${ADMIN_LOGIN}@jourdain.local`;

async function bootstrap() {
  if (!FANTOMAS_PASSWORD) {
    console.error("ERROR: FANTOMAS_INITIAL_PASSWORD is not set.");
    process.exit(1);
  }
  if (!ADMIN_PASSWORD) {
    console.error("ERROR: INITIAL_ADMIN_PASSWORD is not set.");
    process.exit(1);
  }

  console.log("=== JOURDAIN EMPLOI Bootstrap ===");
  console.log("Target: DEV/TEST only (production and preview forbidden)");

  // --- Fantomas ---
  const existingFantomas = await db
    .select()
    .from(users)
    .where(eq(users.username, FANTOMAS_USERNAME))
    .limit(1);

  if (existingFantomas.length > 0) {
    console.log(`Fantomas already exists (username="${FANTOMAS_USERNAME}") — not recreated (no overwrite)`);
  } else {
    console.log("Creating Fantomas principal...");
    try {
      // Step 1: Create user via Better Auth Admin plugin (handles password hashing with scrypt)
      // Username goes in the 'data' field for additional fields
      await auth.api.createUser({
        body: {
          email: FANTOMAS_EMAIL,
          password: FANTOMAS_PASSWORD,
          name: "Fantomas",
          data: {
            username: FANTOMAS_USERNAME,
          },
        },
      });

      // Step 2: Set principalType server-side (input: false — not settable via createUser body)
      // This is a server-side application write, NOT a client input.
      const [newUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, FANTOMAS_USERNAME))
        .limit(1);

      if (newUser) {
        await db
          .update(users)
          .set({ principalType: "FANTOMAS" })
          .where(eq(users.id, newUser.id));
        console.log(`Fantomas principal created (username="${FANTOMAS_USERNAME}", principalType=FANTOMAS)`);
      }
    } catch (error) {
      console.error("Failed to create Fantomas:", error);
      process.exit(1);
    }
  }

  // --- Initial ADMIN ---
  const existingAdmin = await db
    .select()
    .from(users)
    .where(eq(users.username, ADMIN_LOGIN))
    .limit(1);

  if (existingAdmin.length > 0) {
    console.log(`ADMIN already exists (username="${ADMIN_LOGIN}") — not recreated (no overwrite)`);
  } else {
    console.log("Creating initial ADMIN principal...");
    try {
      await auth.api.createUser({
        body: {
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          name: ADMIN_LOGIN,
          data: {
            username: ADMIN_LOGIN,
          },
        },
      });

      // Set principalType server-side (default is ADMIN, but set explicitly for clarity)
      const [newUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, ADMIN_LOGIN))
        .limit(1);

      if (newUser) {
        await db
          .update(users)
          .set({ principalType: "ADMIN" })
          .where(eq(users.id, newUser.id));
        console.log(`ADMIN principal created (username="${ADMIN_LOGIN}", principalType=ADMIN)`);
      }
    } catch (error) {
      console.error("Failed to create initial ADMIN:", error);
      process.exit(1);
    }
  }

  console.log("=== Bootstrap complete ===");
  console.log("Summary:");
  console.log("  Fantomas: exists (principalType=FANTOMAS)");
  console.log("  Initial ADMIN: exists (principalType=ADMIN)");
  console.log("  Public signup: disabled");
}

bootstrap().catch((error) => {
  console.error("Bootstrap failed:", error);
  process.exit(1);
});
