import { createRouter } from "../../lib/create-app";

import * as handlers from "./sub-categories.handlers";
import * as routes from "./sub-categories.routes";

const router = createRouter()
  .openapi(
    routes.listSubCategoriesByCategory,
    handlers.listSubCategoriesByCategory
  )
  .openapi(routes.getSubCategoryById, handlers.getSubCategoryById)
  .openapi(routes.listSubCategories, handlers.listSubCategories);

export default router;
