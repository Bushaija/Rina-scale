import { createRouter } from "../../lib/create-app";
import { authMiddleware } from "../../middlewares/auth";

import * as handlers from "./utilities.handlers";
import * as routes from "./utilities.routes";

const router = createRouter()
  .use(authMiddleware)
  .openapi(routes.deleteExecutionData, handlers.deleteExecutionData)
  .openapi(routes.getRecentActivity, handlers.getRecentActivity)
  .openapi(routes.bulkUpsertExecutionData, handlers.bulkUpsertExecutionData);

export default router;
