import { createRouter } from "../../lib/create-app";

import * as handlers from "./planning-data.handlers";
import * as routes from "./planning-data.routes";

const router = createRouter()
    .openapi(routes.checkExists, handlers.checkExists)
    .openapi(routes.create, handlers.create)
    .openapi(routes.update, handlers.update);

export default router;