import { createRouter } from "../../lib/create-app";
import { authMiddleware } from "../../middlewares/auth";

import * as handlers from "./analytics.handlers";
import * as routes from "./analytics.routes";

const router = createRouter()
  .use(authMiddleware)
  .openapi(routes.getUserProgress, handlers.getUserProgress)
  .openapi(routes.getQuarterlyTotals, handlers.getQuarterlyTotals);

export default router;
