import type { Database } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

/* eslint-disable no-console */
export async function seedPlanningActivityEventMappings(
  db: Database,
  projectCode: string = 'HIV',
) {
  console.log(`Seeding planning activity event mappings for project ${projectCode}…`);

  // Get project ID
  const projRow = await db
    .select({ id: schema.projects.id })
    .from(schema.projects)
    .where(eq(schema.projects.code, projectCode))
    .limit(1);
  const projectId = projRow[0]?.id;
  if (!projectId) throw new Error(`Project ${projectCode} not found.`);

  // Get the "GOODS_SERVICES" event ID
  const eventRow = await db
    .select({ id: schema.events.id })
    .from(schema.events)
    .where(eq(schema.events.code, 'GOODS_SERVICES_PLANNING'))
    .limit(1);
  const eventId = eventRow[0]?.id;
  if (!eventId) throw new Error('GOODS_SERVICES_PLANNING event not found.');

  // Get all planning activities for the project
  const planningActivities = await db
    .select({ id: schema.planningActivities.id })
    .from(schema.planningActivities)
    .where(eq(schema.planningActivities.projectId, projectId));

  // Create mappings
  const mappings = planningActivities.map((activity) => ({
    planningActivityId: activity.id,
    eventId: eventId,
    mappingType: 'DIRECT' as const,
  }));

  await db.insert(schema.planningActivityEventMappings).values(mappings).onConflictDoNothing();
  console.log(`Seeded ${mappings.length} planning activity event mappings.`);
}

export default async function seed(db: Database) {
  await seedPlanningActivityEventMappings(db, 'HIV');
}
