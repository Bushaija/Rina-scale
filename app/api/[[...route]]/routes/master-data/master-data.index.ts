import { createRouter } from "../../lib/create-app";

import * as handlers from "./master-data.handler";
import * as routes from "./master-data.routes";

const router = createRouter()
  .openapi(routes.getCategories, handlers.getCategories)
  .openapi(routes.getSubCategories, handlers.getSubCategories)
  .openapi(routes.getActivities, handlers.getActivities)
  .openapi(routes.getHierarchicalData, handlers.getHierarchicalData);

export default router;
