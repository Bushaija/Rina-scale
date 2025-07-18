import { createRouter } from "../../lib/create-app";
import { authMiddleware } from "../../middlewares/auth";

import * as handlers from "./execution-reporting.handlers";
import * as routes from "./execution-reporting.routes";

const router = createRouter()
  .use(authMiddleware)
  .openapi(
    routes.getComprehensiveReport,
    handlers.getComprehensiveReport
  )
  .openapi(routes.getCategorySummary, handlers.getCategorySummary)
  .openapi(routes.getUserExecutionData, handlers.getUserExecutionData);

export default router;
