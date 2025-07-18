import { createRouter } from "../../lib/create-app";
import { authMiddleware } from "../../middlewares/auth";

import * as handlers from "./frontend.handlers";
import * as routes from "./frontend.routes";

const router = createRouter()
  .use(authMiddleware)
  .openapi(routes.getProjectExecutionData, handlers.getProjectExecutionData)
  .openapi(routes.getFacilityUpdateInfo, handlers.getFacilityUpdateInfo)
  .openapi(routes.getExecutedFacilities, handlers.listExecutedFacilities)
  .openapi(routes.postExecutionData, handlers.postExecutionData);

export default router;
