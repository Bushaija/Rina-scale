import { createRouter } from "../../lib/create-app";
import { authMiddleware } from "../../middlewares/auth";

import * as handlers from "./statements.handlers";
import * as routes from "./statements.routes";

const router = createRouter()
  .use(authMiddleware)
  .openapi(routes.getRevenueExpenditureAll, handlers.getRevenueExpenditureAll)
  .openapi(routes.getRevenueExpenditureAggregate, handlers.getRevenueExpenditureAggregate)
  .openapi(routes.getAssetsLiabilitiesAggregate, handlers.getAssetsLiabilitiesAggregate)
  .openapi(routes.getCashFlowAggregate, handlers.getCashFlowAggregate)
  .openapi(routes.getBudgetVsActualAggregate, handlers.getBudgetVsActualAggregate)
  .openapi(routes.getNetAssetsChangesAggregate, handlers.getNetAssetsChangesAggregate)

  // per-facility routes
  .openapi(routes.getRevenueExpenditure, handlers.getRevenueExpenditure)
  .openapi(routes.getAssetsLiabilities, handlers.getAssetsLiabilities)
  .openapi(routes.getCashFlow, handlers.getCashFlow)
  .openapi(routes.getBudgetVsActual, handlers.getBudgetVsActual)
  .openapi(routes.getNetAssetsChanges, handlers.getNetAssetsChanges);

export default router;
