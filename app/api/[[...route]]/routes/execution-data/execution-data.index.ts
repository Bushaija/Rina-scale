import { createRouter } from "../../lib/create-app";

import * as handlers from "./execution-data.handlers";
import * as routes from "./execution-data.routes";

const router = createRouter()
    .openapi(routes.list, handlers.list)
    .openapi(routes.getByPeriodAndActivity, handlers.getByPeriodAndActivity)
    .openapi(routes.checkExists, handlers.checkExists)
    .openapi(routes.create, handlers.create)
    .openapi(routes.getOne, handlers.getOne)
    .openapi(routes.update, handlers.update)
    .openapi(routes.remove, handlers.remove);

export default router;
