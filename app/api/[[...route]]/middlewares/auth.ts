import type { Context, Next } from "hono";
import { auth } from "@/lib/auth";
import type { AppBindings } from "../lib/types";

export async function authMiddleware(c: Context<AppBindings>, next: Next) {
  const session = await auth.api.getSession({
    headers: new Headers(c.req.header()),
  });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Add user info to context
  c.set("user", session.user);
  c.set("session", {
    ...session.session,
    expiresAt: session.session.expiresAt.getTime(),
  });
  
  return await next();
}