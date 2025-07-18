import { createRouter } from "../../lib/create-app";

import * as handlers from "./reports.handlers";
import * as routes from "./reports.routes";

const router = createRouter()
  .openapi(routes.financialSummary, handlers.generateFinancialSummary)
  .openapi(routes.varianceAnalysis, handlers.generateVarianceAnalysis)
  .openapi(routes.facilityComparison, handlers.generateFacilityComparison);

export default router;
