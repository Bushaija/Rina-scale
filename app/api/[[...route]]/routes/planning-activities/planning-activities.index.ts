import { createRouter } from "../../lib/create-app";
import { authMiddleware } from "../../middlewares/auth";
import * as handlers from "./planning-activities.handlers";
import * as routes from "./planning-activities.routes";

const router = createRouter()
    .use(authMiddleware)
    .openapi(routes.listPlanningActivities, handlers.listPlanningActivities)
    .openapi(routes.getPlanningActivitiesByFacilityId, handlers.getPlanningActivitiesByFacilityId)
    .openapi(routes.getPlanningTotalsByFacilityId, handlers.getPlanningTotalsByFacilityId);

export default router;
// zncc