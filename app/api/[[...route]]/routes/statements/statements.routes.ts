import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import { rowSchema, statementParamSchema } from "./statements.types";

const tags = ["statements"];

export const getRevenueExpenditure = createRoute({
  path: "/statements/revenue-expenditure/{facilityId}/{periodId}",
  method: "get",
  tags,
  request: {
    params: statementParamSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(rowSchema),
      "Revenue and Expenditure rows"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ error: z.string() }),
      "User facility not found"
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      z.object({ error: z.string(), message: z.string() }),
      "Access denied - can only access assigned facility"
    ),
  },
});

export const getAssetsLiabilities = createRoute({
  path: "/statements/assets-liabilities/{facilityId}/{periodId}",
  method: "get",
  tags,
  request: {
    params: statementParamSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(rowSchema),
      "Assets and Liabilities rows"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ error: z.string() }),
      "User facility not found"
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      z.object({ error: z.string(), message: z.string() }),
      "Access denied - can only access assigned facility"
    ),
  },
});

export const getCashFlow = createRoute({
  path: "/statements/cash-flow/{facilityId}/{periodId}",
  method: "get",
  tags,
  request: {
    params: statementParamSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(rowSchema),
      "Cash Flow rows"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ error: z.string() }),
      "User facility not found"
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      z.object({ error: z.string(), message: z.string() }),
      "Access denied - can only access assigned facility"
    ),
  },
});

export const getBudgetVsActual = createRoute({
  path: "/statements/budget-vs-actual/{facilityId}/{periodId}",
  method: "get",
  tags,
  request: {
    params: statementParamSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(rowSchema),
      "Budget vs Actual rows"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ error: z.string() }),
      "User facility not found"
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      z.object({ error: z.string(), message: z.string() }),
      "Access denied - can only access assigned facility"
    ),
  },
});

export const getNetAssetsChanges = createRoute({
  path: "/statements/net-assets-changes/{facilityId}/{periodId}",
  method: "get",
  tags,
  request: {
    params: statementParamSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(rowSchema),
      "Changes in Net Assets rows"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ error: z.string() }),
      "User facility not found"
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      z.object({ error: z.string(), message: z.string() }),
      "Access denied - can only access assigned facility"
    ),
  },
});

const periodParam = z.object({
  periodId: z.coerce.number().int().positive().openapi({ example: 2025 }),
});

export const getRevenueExpenditureAll = createRoute({
  path: "/statements/revenue-expenditure/summary/{periodId}",
  method: "get",
  tags,
  request: { params: periodParam },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(
        z.object({
          facilityId: z.number().int(),
          rows: z.array(rowSchema),
        })
      ),
      "Revenue-Expenditure for all facilities"
    ),
  },
});


// aggregated routes
export const getRevenueExpenditureAggregate = createRoute({
  path: "/statements/revenue-expenditure/aggregate/{periodId}",
  method: "get",
  tags,
  request: { params: periodParam },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(rowSchema),
      "Aggregated Revenue-Expenditure rows"
    ),
  },
});

export const getAssetsLiabilitiesAggregate = createRoute({
  path: "/statements/assets-liabilities/aggregate/{periodId}",
  method: "get",
  tags,
  request: { params: periodParam },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(rowSchema),
      "Aggregated Assets & Liabilities rows"
    ),
  },
});

export const getCashFlowAggregate = createRoute({
  path: "/statements/cash-flow/aggregate/{periodId}",
  method: "get",
  tags,
  request: { params: periodParam },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(rowSchema),
      "Aggregated Cash-Flow rows"
    ),
  },
});

export const getBudgetVsActualAggregate = createRoute({
  path: "/statements/budget-vs-actual/aggregate/{periodId}",
  method: "get",
  tags,
  request: { params: periodParam },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(rowSchema),
      "Aggregated Budget vs Actual rows"
    ),
  },
});

export const getNetAssetsChangesAggregate = createRoute({
  path: "/statements/net-assets-changes/aggregate/{periodId}",
  method: "get",
  tags,
  request: { params: periodParam },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(rowSchema),
      "Aggregated Net Assets Changes rows"
    ),
  },
});

export type GetRevenueExpenditureRoute = typeof getRevenueExpenditure;
export type GetAssetsLiabilitiesRoute = typeof getAssetsLiabilities;
export type GetCashFlowRoute = typeof getCashFlow;
export type GetBudgetVsActualRoute = typeof getBudgetVsActual;
export type GetNetAssetsChangesRoute = typeof getNetAssetsChanges;
export type GetRevenueExpenditureAllRoute = typeof getRevenueExpenditureAll;
export type GetRevenueExpenditureAggregateRoute = typeof getRevenueExpenditureAggregate;
export type GetAssetsLiabilitiesAggregateRoute = typeof getAssetsLiabilitiesAggregate;
export type GetCashFlowAggregateRoute = typeof getCashFlowAggregate;
export type GetBudgetVsActualAggregateRoute = typeof getBudgetVsActualAggregate;
export type GetNetAssetsChangesAggregateRoute = typeof getNetAssetsChangesAggregate;
