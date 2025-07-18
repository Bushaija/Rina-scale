import { createRouter } from "../../lib/create-app";
import { authMiddleware } from "../../middlewares/auth";

import * as handlers from "./planned-facilities.handlers";
import * as routes from "./planned-facilities.routes";

const router = createRouter()
    .use(authMiddleware)
    .openapi(routes.getAlreadyPlannedFacilities, handlers.getAlreadyPlannedFacilities)
    .openapi(routes.getAllPlanningData, handlers.getAllPlanningData);

export default router;