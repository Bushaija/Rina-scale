import { createRouter } from "../../lib/create-app";
// import type { AppBindings } from "../lib/types";
import { auth } from "@/lib/auth"

const router = createRouter();

// Handle all Better Auth routes
router.on(["POST", "GET"], "/auth/*", async (c) => {
  return auth.handler(c.req.raw);
});

export default router;