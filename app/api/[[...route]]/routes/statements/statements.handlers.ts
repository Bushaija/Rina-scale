import type { AppRouteHandler } from "../../lib/types";
import {
  getRevExpRows,
  getRevExpAll,
  getRevExpAggregate,
  getAssetsLiabRows,
  getCashFlowRows,
  getBudgetVsActualRows,
  getNetAssetsChangesRows,
  getAssetsLiabAggregate as aggAssetsLiab,
  getCashFlowAggregate as aggCashFlow,
  getBudgetVsActualAggregate as aggBva,
  getNetAssetsChangesAggregate as aggNetAssets,
} from "./statements.services";
import { db } from "@/db";
import * as schemas from "@/db/schema";
import { eq } from "drizzle-orm";
import type {
  GetRevenueExpenditureRoute,
  GetAssetsLiabilitiesRoute,
  GetCashFlowRoute,
  GetBudgetVsActualRoute,
  GetNetAssetsChangesRoute,
  GetRevenueExpenditureAllRoute,
  GetRevenueExpenditureAggregateRoute,
  GetAssetsLiabilitiesAggregateRoute,
  GetCashFlowAggregateRoute,
  GetBudgetVsActualAggregateRoute,
  GetNetAssetsChangesAggregateRoute,
} from "./statements.routes";

export const getRevenueExpenditure: AppRouteHandler<GetRevenueExpenditureRoute> = async (c) => {
  const { facilityId, periodId } = c.req.valid("param");
  const user = c.get("user");

  // Authorization check: ensure user can only access data for facilities in their district
  if (!user?.facilityId) {
    return c.json({ error: "User facility not found" }, 401);
  }

  // Get user's facility and district
  const userFacility = await db.query.facilities.findFirst({
    where: eq(schemas.facilities.id, user.facilityId),
    columns: { districtId: true }
  });

  if (!userFacility) {
    return c.json({ error: "User facility not found" }, 401);
  }

  // Get requested facility's district
  const requestedFacility = await db.query.facilities.findFirst({
    where: eq(schemas.facilities.id, facilityId),
    columns: { districtId: true }
  });

  if (!requestedFacility) {
    return c.json({ error: "Requested facility not found" }, 404);
  }

  // Check if both facilities are in the same district
  if (userFacility.districtId !== requestedFacility.districtId) {
    return c.json({ 
      error: "Access denied", 
      message: "You can only access data for facilities in your district" 
    }, 403);
  }

  const rows = await getRevExpRows(facilityId, periodId, null);
  return c.json(rows);
};

export const getAssetsLiabilities: AppRouteHandler<GetAssetsLiabilitiesRoute> = async (c) => {
  const { facilityId, periodId } = c.req.valid("param");
  const user = c.get("user");

  // Authorization check: ensure user can only access data for facilities in their district
  if (!user?.facilityId) {
    return c.json({ error: "User facility not found" }, 401);
  }

  // Get user's facility and district
  const userFacility = await db.query.facilities.findFirst({
    where: eq(schemas.facilities.id, user.facilityId),
    columns: { districtId: true }
  });

  if (!userFacility) {
    return c.json({ error: "User facility not found" }, 401);
  }

  // Get requested facility's district
  const requestedFacility = await db.query.facilities.findFirst({
    where: eq(schemas.facilities.id, facilityId),
    columns: { districtId: true }
  });

  if (!requestedFacility) {
    return c.json({ error: "Requested facility not found" }, 404);
  }

  // Check if both facilities are in the same district
  if (userFacility.districtId !== requestedFacility.districtId) {
    return c.json({ 
      error: "Access denied", 
      message: "You can only access data for facilities in your district" 
    }, 403);
  }

  const rows = await getAssetsLiabRows(facilityId, periodId, null);
  return c.json(rows);
};

export const getCashFlow: AppRouteHandler<GetCashFlowRoute> = async (c) => {
  const { facilityId, periodId } = c.req.valid("param");
  const user = c.get("user");

  // Authorization check: ensure user can only access data for facilities in their district
  if (!user?.facilityId) {
    return c.json({ error: "User facility not found" }, 401);
  }

  // Get user's facility and district
  const userFacility = await db.query.facilities.findFirst({
    where: eq(schemas.facilities.id, user.facilityId),
    columns: { districtId: true }
  });

  if (!userFacility) {
    return c.json({ error: "User facility not found" }, 401);
  }

  // Get requested facility's district
  const requestedFacility = await db.query.facilities.findFirst({
    where: eq(schemas.facilities.id, facilityId),
    columns: { districtId: true }
  });

  if (!requestedFacility) {
    return c.json({ error: "Requested facility not found" }, 404);
  }

  // Check if both facilities are in the same district
  if (userFacility.districtId !== requestedFacility.districtId) {
    return c.json({ 
      error: "Access denied", 
      message: "You can only access data for facilities in your district" 
    }, 403);
  }

  const rows = await getCashFlowRows(facilityId, periodId, null);
  return c.json(rows);
};

export const getBudgetVsActual: AppRouteHandler<GetBudgetVsActualRoute> = async (c) => {
  const { facilityId, periodId } = c.req.valid("param");
  const user = c.get("user");

  // Authorization check: ensure user can only access data for facilities in their district
  if (!user?.facilityId) {
    return c.json({ error: "User facility not found" }, 401);
  }

  // Get user's facility and district
  const userFacility = await db.query.facilities.findFirst({
    where: eq(schemas.facilities.id, user.facilityId),
    columns: { districtId: true }
  });

  if (!userFacility) {
    return c.json({ error: "User facility not found" }, 401);
  }

  // Get requested facility's district
  const requestedFacility = await db.query.facilities.findFirst({
    where: eq(schemas.facilities.id, facilityId),
    columns: { districtId: true }
  });

  if (!requestedFacility) {
    return c.json({ error: "Requested facility not found" }, 404);
  }

  // Check if both facilities are in the same district
  if (userFacility.districtId !== requestedFacility.districtId) {
    return c.json({ 
      error: "Access denied", 
      message: "You can only access data for facilities in your district" 
    }, 403);
  }

  const rows = await getBudgetVsActualRows(facilityId, periodId);
  return c.json(rows);
};

export const getNetAssetsChanges: AppRouteHandler<GetNetAssetsChangesRoute> = async (c) => {
  const { facilityId, periodId } = c.req.valid("param");
  const user = c.get("user");

  // Authorization check: ensure user can only access data for facilities in their district
  if (!user?.facilityId) {
    return c.json({ error: "User facility not found" }, 401);
  }

  // Get user's facility and district
  const userFacility = await db.query.facilities.findFirst({
    where: eq(schemas.facilities.id, user.facilityId),
    columns: { districtId: true }
  });

  if (!userFacility) {
    return c.json({ error: "User facility not found" }, 401);
  }

  // Get requested facility's district
  const requestedFacility = await db.query.facilities.findFirst({
    where: eq(schemas.facilities.id, facilityId),
    columns: { districtId: true }
  });

  if (!requestedFacility) {
    return c.json({ error: "Requested facility not found" }, 404);
  }

  // Check if both facilities are in the same district
  if (userFacility.districtId !== requestedFacility.districtId) {
    return c.json({ 
      error: "Access denied", 
      message: "You can only access data for facilities in your district" 
    }, 403);
  }

  const rows = await getNetAssetsChangesRows(facilityId, periodId);
  return c.json(rows);
};

// export const getAllRevExpHandler: AppRouteHandler<GetAllRevExpRoute> = async (c) => {
//   const { periodId } = c.req.valid("param");
//   const data = await getStatementForAll("REV_EXP", Number(periodId));
//   return c.json(data);
// };

export const getRevenueExpenditureAll: AppRouteHandler<GetRevenueExpenditureAllRoute> =
  async (c) => {
    const { periodId } = c.req.valid("param");
    const data = await getRevExpAll(periodId);
    return c.json(data);
  };

export const getRevenueExpenditureAggregate: AppRouteHandler<GetRevenueExpenditureAggregateRoute> =
  async (c) => {
    const { periodId } = c.req.valid("param");
    const rows = await getRevExpAggregate(periodId);
    return c.json(rows);
  };

export const getAssetsLiabilitiesAggregate: AppRouteHandler<GetAssetsLiabilitiesAggregateRoute> = async (c) => {
  const { periodId } = c.req.valid("param");
  const rows = await aggAssetsLiab(periodId);
  return c.json(rows);
};

export const getCashFlowAggregate: AppRouteHandler<GetCashFlowAggregateRoute> = async (c) => {
  const { periodId } = c.req.valid("param");
  const rows = await aggCashFlow(periodId);
  return c.json(rows);
};

export const getBudgetVsActualAggregate: AppRouteHandler<GetBudgetVsActualAggregateRoute> = async (c) => {
  const { periodId } = c.req.valid("param");
  const rows = await aggBva(periodId);
  return c.json(rows);
};

export const getNetAssetsChangesAggregate: AppRouteHandler<GetNetAssetsChangesAggregateRoute> = async (c) => {
  const { periodId } = c.req.valid("param");
  const rows = await aggNetAssets(periodId);
  return c.json(rows);
};
