import { createRouter } from "../../lib/create-app";

import * as handlers from "./activities.handlers";
import * as routes from "./activities.routes";

const router = createRouter()
  .openapi(
    routes.listActivitiesByCategoryNoTotals,
    handlers.listActivitiesByCategoryNoTotals
  )
  .openapi(
    routes.listActivitiesByCategory,
    handlers.listActivitiesByCategory
  )
  .openapi(routes.getActivityById, handlers.getActivityById)
  .openapi(routes.listActivities, handlers.listActivities);

export default router;
