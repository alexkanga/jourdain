import { toNextJsHandler } from "better-auth/next-js";

// Force dynamic — this route requires runtime env vars (DATABASE_URL, BETTER_AUTH_SECRET)
export const dynamic = "force-dynamic";

// Lazy load auth to avoid DATABASE_URL requirement at build time
const handler = async () => {
  const { auth } = await import("@/lib/server/auth/auth");
  return toNextJsHandler(auth);
};

export async function GET(req: Request) {
  const { GET } = await handler();
  return GET(req);
}

export async function POST(req: Request) {
  const { POST } = await handler();
  return POST(req);
}
