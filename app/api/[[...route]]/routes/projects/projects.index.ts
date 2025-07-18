import { createRouter } from "../../lib/create-app";

import * as handlers from "./projects.handlers";
import * as routes from "./projects.routes";

const router = createRouter()
  .openapi(routes.checkProjectExists, handlers.checkProjectExists)
  .openapi(routes.listUserProjects, handlers.listUserProjects)
  .openapi(routes.updateProjectStatus, handlers.updateProjectStatus)
  .openapi(routes.getProject, handlers.getProject)
  .openapi(routes.listProjects, handlers.listProjects)
  .openapi(routes.createProject, handlers.createProject);

export default router;
