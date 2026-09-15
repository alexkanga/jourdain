import { auth } from "./auth";
import { db } from "@/db/index";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { can, type Capability, type Principal } from "./capabilities";

export { can, type Capability, type Principal };

// getPrincipal() — maps Better Auth session to our Principal type
// Reads principalType (NOT Better Auth role) — this is the ONLY place where
// Better Auth session is mapped to our business Principal
export async function getPrincipal(): Promise<Principal | null> {
  const session = await auth.api.getSession({ headers: new Headers() });
  if (!session || !session.user) {
    return null;
  }

  // Fetch principalType from DB (it's input: false so it's not in the session by default
  // unless Better Auth returns it via additionalFields with returned: true)
  const [userRecord] = await db
    .select({ principalType: users.principalType, username: users.username })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!userRecord) {
    return null;
  }

  return {
    id: session.user.id,
    username: userRecord.username,
    principalType: userRecord.principalType as Principal["principalType"],
  };
}

// requireCapability() — canonical entry point for Server Actions
// Throws an authorization error if the principal is not authenticated or lacks the capability
export async function requireCapability(capability: Capability): Promise<Principal> {
  const principal = await getPrincipal();
  if (!principal) {
    throw new Error("UNAUTHORIZED — not authenticated");
  }
  if (!can(principal, capability)) {
    throw new Error("FORBIDDEN — insufficient capability");
  }
  return principal;
}
