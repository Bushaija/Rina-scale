import { createRouter } from "../../lib/create-app";

import * as handlers from "./planning-config.handlers";
import * as routes from "./planning-config.routes";

const router = createRouter()
  .openapi(routes.getActivityStructure, handlers.getActivityStructure)
  .openapi(routes.createActivityConfiguration, handlers.createActivityConfiguration)
  .openapi(routes.createIndividualActivity, handlers.createIndividualActivity)
  .openapi(routes.getActivityTemplates, handlers.getActivityTemplates)
  .openapi(routes.createActivityTemplate, handlers.createActivityTemplate)
  .openapi(routes.updateActivityTemplate, handlers.updateActivityTemplate)
  .openapi(routes.deactivateActivityTemplate, handlers.deactivateActivityTemplate)
  .openapi(routes.getActivitiesByTemplate, handlers.getActivitiesByTemplate)
  .openapi(routes.getProjectStructure, handlers.getProjectStructure)
  .openapi(routes.importActivityConfiguration, handlers.importActivityConfiguration)
  .openapi(routes.publishActivityConfiguration, handlers.publishActivityConfiguration);

export default router;
