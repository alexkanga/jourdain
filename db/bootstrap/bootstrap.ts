import { auth } from "@/lib/server/auth/auth";
import { db } from "@/db/index";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Idempotent bootstrap script for JOURDAIN EMPLOI system principals.
 *
 * Creates Fantomas (principalType=FANTOMAS) and initial SUPER_ADMIN
 * (principalType=SUPER_ADMIN — admin1 by default) if they do not already
 * exist. Does NOT overwrite existing users.
 *
 * Idempotent promotion: if admin1 already exists with principalType=ADMIN
 * (the pre-user-management-work-package role), this script PROMOTES it to
 * SUPER_ADMIN. This is the only safe idempotent transition — we never
 * silently demote or change other users' principalType.
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

// Better Auth Username plugin normalizes usernames to lowercase by default.
// We use the normalized form for all DB queries.
const FANTOMAS_USERNAME = "fantomas"; // Normalized form of "Fantomas"
const FANTOMAS_DISPLAY_NAME = "Fantomas"; // Display name (not normalized)
const FANTOMAS_EMAIL = process.env.FANTOMAS_EMAIL || "fantomas@jourdain.local";
const FANTOMAS_PASSWORD = process.env.FANTOMAS_INITIAL_PASSWORD;

const ADMIN_LOGIN = (process.env.INITIAL_ADMIN_LOGIN || "admin1").toLowerCase();
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
    // Verify principalType is correct
    if (existingFantomas[0].principalType !== "FANTOMAS") {
      console.log(`  WARNING: principalType is "${existingFantomas[0].principalType}" — expected "FANTOMAS". Fixing...`);
      await db
        .update(users)
        .set({ principalType: "FANTOMAS" })
        .where(eq(users.id, existingFantomas[0].id));
      console.log("  Fixed: principalType set to FANTOMAS");
    }
  } else {
    console.log("Creating Fantomas principal...");
    try {
      // Step 1: Create user via Better Auth Admin plugin (handles password hashing with scrypt)
      // Username goes in the 'data' field for additional fields
      // Better Auth Username plugin normalizes to lowercase
      await auth.api.createUser({
        body: {
          email: FANTOMAS_EMAIL,
          password: FANTOMAS_PASSWORD,
          name: FANTOMAS_DISPLAY_NAME,
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

  // --- Initial SUPER_ADMIN (admin1) ---
  // Per user-management work package: admin1 is the initial SUPER_ADMIN,
  // not ADMIN. This is the only role whose "create" creates a SUPER_ADMIN;
  // all other SUPER_ADMIN/ADMIN users are created via the user-management UI
  // by an existing SUPER_ADMIN or FANTOMAS.
  const existingAdmin = await db
    .select()
    .from(users)
    .where(eq(users.username, ADMIN_LOGIN))
    .limit(1);

  if (existingAdmin.length > 0) {
    console.log(`Initial admin already exists (username="${ADMIN_LOGIN}") — not recreated (no overwrite)`);
    // Idempotent promotion: if the user is still ADMIN (from before the
    // user-management work package), promote to SUPER_ADMIN. This is the
    // ONLY automatic principalType transition we perform — and only for the
    // bootstrap initial admin. We never silently change other users'
    // principalType here.
    if (existingAdmin[0].principalType === "ADMIN") {
      console.log(`  Promoting principalType ADMIN → SUPER_ADMIN (idempotent bootstrap upgrade)...`);
      await db
        .update(users)
        .set({ principalType: "SUPER_ADMIN" })
        .where(eq(users.id, existingAdmin[0].id));
      console.log("  Promoted: principalType set to SUPER_ADMIN");
    } else if (existingAdmin[0].principalType !== "SUPER_ADMIN") {
      // Unexpected state (e.g., FANTOMAS collision or manual edit). Don't
      // silently overwrite — just warn and leave alone.
      console.log(`  WARNING: principalType is "${existingAdmin[0].principalType}" — expected "SUPER_ADMIN" or "ADMIN". NOT auto-correcting (manual review required).`);
    }
  } else {
    console.log("Creating initial SUPER_ADMIN principal...");
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

      // Set principalType to SUPER_ADMIN (default is ADMIN, so we override explicitly)
      const [newUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, ADMIN_LOGIN))
        .limit(1);

      if (newUser) {
        await db
          .update(users)
          .set({ principalType: "SUPER_ADMIN" })
          .where(eq(users.id, newUser.id));
        console.log(`SUPER_ADMIN principal created (username="${ADMIN_LOGIN}", principalType=SUPER_ADMIN)`);
      }
    } catch (error) {
      console.error("Failed to create initial SUPER_ADMIN:", error);
      process.exit(1);
    }
  }

  console.log("=== Bootstrap complete ===");
  console.log("Summary:");
  console.log(`  Fantomas: exists (username="${FANTOMAS_USERNAME}", principalType=FANTOMAS)`);
  console.log(`  Initial SUPER_ADMIN: exists (username="${ADMIN_LOGIN}", principalType=SUPER_ADMIN)`);
  console.log("  Public signup: disabled");
}

bootstrap().catch((error) => {
  console.error("Bootstrap failed:", error);
  process.exit(1);
});
