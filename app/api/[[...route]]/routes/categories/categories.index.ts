import { createRouter } from "../../lib/create-app";

import * as handlers from "./categories.handlers";
import * as routes from "./categories.routes";

const router = createRouter()
  .openapi(
    routes.listCategoriesWithSubCategoryCount,
    handlers.listCategoriesWithSubCategoryCount
  )
  .openapi(routes.listCategories, handlers.listCategories)
  .openapi(routes.getCategoryById, handlers.getCategoryById);

export default router;
