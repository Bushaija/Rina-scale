import type { Database } from "@/db";
import * as schema from "@/db/schema";

/**
 * Returns a Map of eventCode -> eventId for quick look-ups while seeding
 */
export async function getEventCodeIdMap(db: Database): Promise<Map<string, number>> {
  const events = await db.select().from(schema.events);
  return new Map(events.map(e => [e.code, e.id]));
} 