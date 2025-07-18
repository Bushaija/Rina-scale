import db from "@/db";
import * as schema from "@/db/schema";
import { desc, eq, and } from "drizzle-orm";

import type { AppRouteHandler } from "../../lib/types";
import type {
  GetCategoriesRoute, 
  GetSubCategoriesRoute,
  GetActivitiesRoute,
  GetHierarchicalDataRoute,
} from "./master-data.routes";

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const getCategories: AppRouteHandler<GetCategoriesRoute> = async (c) => {
  // try {
    const data = await db.query.categories.findMany({
      orderBy: desc(schema.categories.displayOrder),
    });
    return c.json({ data });
  // } catch (error) {
  //   c.get("logger").error("Error getting categories:", error);
  //   return c.json(
  //     {
  //       error: "INTERNAL_ERROR",
  //       message: "Failed to retrieve categories",
  //     },
  //     500
  //   );
  // }
};

export const getSubCategories: AppRouteHandler<GetSubCategoriesRoute> = async (
  c
) => {
  // try {
    const query = c.req.valid("query");

    const data = await db.query.subCategories.findMany({
      where: query.categoryId
        ? eq(schema.subCategories.categoryId, query.categoryId)
        : undefined,
      with: {
        category: true,
      },
      orderBy: desc(schema.subCategories.displayOrder),
    });

    return c.json({ data });
  // } catch (error) {
  //   c.get("logger").error("Error getting sub-categories:", error);
  //   return c.json(
  //     {
  //       error: "INTERNAL_ERROR",
  //       message: "Failed to retrieve sub-categories",
  //     },
  //     500
  //   );
  // }
};

export const getActivities: AppRouteHandler<GetActivitiesRoute> = async (c) => {
  // try {
    const query = c.req.valid("query");

    // Build where conditions
    const whereConditions = [] as any[];
    if (query.categoryId) {
      whereConditions.push(eq(schema.activities.categoryId, query.categoryId));
    }
    if (query.subCategoryId) {
      whereConditions.push(eq(schema.activities.subCategoryId, query.subCategoryId));
    }
    if (query.excludeTotalRows) {
      whereConditions.push(eq(schema.activities.isTotalRow, false));
    }

    const data = await db.query.activities.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      with: {
        category: true,
        subCategory: {
          with: {
            category: true,
          },
        },
      },
      orderBy: desc(schema.activities.displayOrder),
    });

    return c.json({ data });
  // } catch (error) {
  //   c.get("logger").error("Error getting activities:", error);
  //   return c.json(
  //     {
  //       error: "INTERNAL_ERROR",
  //       message: "Failed to retrieve activities",
  //     },
  //     500
  //   );
  // }
};

export const getHierarchicalData: AppRouteHandler<GetHierarchicalDataRoute> = async (
  c
) => {
  // try {
    // Get all categories with their relationships
    const categories = await db.query.categories.findMany({
      with: {
        subCategories: {
          with: {
            activities: {
              orderBy: desc(schema.activities.displayOrder),
            },
          },
          orderBy: desc(schema.subCategories.displayOrder),
        },
        activities: {
          orderBy: desc(schema.activities.displayOrder),
        },
      },
      orderBy: desc(schema.categories.displayOrder),
    });

    // Transform the data into the required structure
    const hierarchicalData = {
      categories: categories.map((category) => ({
        id: category.id,
        code: category.code,
        name: category.name,
        displayOrder: category.displayOrder,
        subCategories: category.subCategories.map((subCat) => ({
          id: subCat.id,
          code: subCat.code,
          name: subCat.name,
          displayOrder: subCat.displayOrder,
          activities: subCat.activities.map((activity) => ({
            id: activity.id,
            name: activity.name,
            displayOrder: activity.displayOrder,
            isTotalRow: activity.isTotalRow ?? false,
          })),
        })),
        directActivities: category.activities
          .filter((activity) => !activity.subCategoryId)
          .map((activity) => ({
            id: activity.id,
            name: activity.name,
            displayOrder: activity.displayOrder,
            isTotalRow: activity.isTotalRow ?? false,
          })),
      })),
    };

    return c.json(hierarchicalData);
  // } catch (error) {
  //   c.get("logger").error("Error getting hierarchical data:", error);
  //   return c.json(
  //     {
  //       error: "INTERNAL_ERROR",
  //       message: "Failed to retrieve hierarchical data",
  //     },
  //     500
  //   );
  // }
}; 