import type { Database } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

interface PlanningCategoryData {
  facilityType: 'hospital' | 'health_center';
  code: string;
  name: string;
  displayOrder: number;
}

// Program-specific category definitions
const programCategories: Record<string, { code: string; name: string }[]> = {
  // ---------------- HIV PROGRAM ----------------
  HIV: [
    { code: 'HR',  name: 'Human Resources' },
    { code: 'TRC', name: 'Travel Related Costs' },
    { code: 'HPE', name: 'Health Products & Equipment' },
    { code: 'PA',  name: 'Program Administration Costs' },
  ],

  // ---------------- MALARIA PROGRAM ----------------
  MAL: [
    { code: 'EPID', name: 'Epidemiology' },
    { code: 'PM',   name: 'Program Management' },
    { code: 'HR',   name: 'Human Resources' },
  ],

  // ---------------- TB PROGRAM ----------------
  TB: [
    { code: 'HR',  name: 'Human Resources' },
    { code: 'TRC', name: 'Travel Related Costs' },
    { code: 'PA',  name: 'Program Administration Costs' },
  ]
};

function generateCategoriesForProject(projectCode: string): PlanningCategoryData[] {
  const baseCategories = programCategories[projectCode];
  if (!baseCategories) {
    console.warn(`No categories defined for program ${projectCode}`);
    return [];
  }

  const hospitalCategories: PlanningCategoryData[] = baseCategories.map((c, idx) => ({
    facilityType: 'hospital',
    ...c,
    displayOrder: idx + 1,
  }));

  const healthCenterCategories: PlanningCategoryData[] = baseCategories.map((c, idx) => ({
    facilityType: 'health_center',
    ...c,
    displayOrder: idx + 1,
  }));

  return [
    ...hospitalCategories,
    ...healthCenterCategories,
  ];
}

/* eslint-disable no-console */
export async function seedPlanningCategories(
  db: Database,
  projectCode: string = 'HIV',
) {
  console.log(`Seeding planning categories for project ${projectCode}…`);

  const projectRow = await db
    .select({ id: schema.projects.id })
    .from(schema.projects)
    .where(eq(schema.projects.code, projectCode))
    .limit(1);

  const projectId = projectRow[0]?.id;
  if (!projectId) throw new Error(`Project ${projectCode} not found`);

  const categories = generateCategoriesForProject(projectCode);
  if (categories.length === 0) {
    console.warn(`No categories to seed for project ${projectCode}`);
    return;
  }

  const rows = categories.map((c) => ({
    projectId,
    facilityType: c.facilityType,
    code: c.code,
    name: c.name,
    displayOrder: c.displayOrder,
  }));

  await db.insert(schema.planningCategories).values(rows).onConflictDoNothing();
  console.log(`Seeded ${rows.length} planning categories for ${projectCode}.`);
}

// Function to seed all programs
export async function seedAllProgramCategories(db: Database) {
  const programs = Object.keys(programCategories);
  console.log(`Seeding categories for ${programs.length} programs: ${programs.join(', ')}`);
  
  for (const program of programs) {
    try {
      await seedPlanningCategories(db, program);
    } catch (error) {
      console.error(`Failed to seed categories for ${program}:`, error);
    }
  }
}

// Default export maintains backward compatibility but now seeds all programs
export default async function seed(db: Database) {
  await seedAllProgramCategories(db);
}
