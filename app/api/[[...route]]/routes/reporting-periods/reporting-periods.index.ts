import { createRouter } from "../../lib/create-app";

import * as handlers from "./reporting-periods.handlers";
import * as routes from "./reporting-periods.routes";

const router = createRouter()
.openapi(
  routes.listActiveReportingPeriods,
  handlers.listActiveReportingPeriods
)
.openapi(
  routes.getCurrentReportingPeriod,
  handlers.getCurrentReportingPeriod
)
.openapi(routes.getReportingPeriodById, handlers.getReportingPeriodById)
.openapi(routes.createReportingPeriod, handlers.createReportingPeriod)
.openapi(routes.listReportingPeriods, handlers.listReportingPeriods);

export default router;
