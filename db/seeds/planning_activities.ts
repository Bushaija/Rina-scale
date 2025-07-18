import type { Database } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

interface PlanningActivityData {
  facilityType: 'hospital' | 'health_center';
  categoryCode: string;
  name: string;
  displayOrder: number;
  isTotalRow?: boolean;
}

// Program-specific activity definitions
const programActivities: Record<string, PlanningActivityData[]> = {
  // ---------------- HIV PROGRAM ----------------
  HIV: [
    // Hospital Activities
    // Human Resources (HR)
    { facilityType: 'hospital', categoryCode: 'HR', name: 'DH Medical Dr. Salary', displayOrder: 1 },
    { facilityType: 'hospital', categoryCode: 'HR', name: 'Senior Medical Dr. Salary', displayOrder: 2 },
    { facilityType: 'hospital', categoryCode: 'HR', name: 'Chief Medical Dr. Salary', displayOrder: 3 },
    { facilityType: 'hospital', categoryCode: 'HR', name: 'Junior Medical Dr. or Mentor Salary', displayOrder: 4 },
    { facilityType: 'hospital', categoryCode: 'HR', name: 'Pharmacist Salary', displayOrder: 5 },
    { facilityType: 'hospital', categoryCode: 'HR', name: 'Nurse Salary', displayOrder: 6 },
    { facilityType: 'hospital', categoryCode: 'HR', name: 'CHW supervisor Salary', displayOrder: 7 },
    { facilityType: 'hospital', categoryCode: 'HR', name: 'Accountant Salary', displayOrder: 8 },
    { facilityType: 'hospital', categoryCode: 'HR', name: 'All Staff Bonus', displayOrder: 9 },

    // Travel Related Costs (TRC)
    { facilityType: 'hospital', categoryCode: 'TRC', name: 'Campaign for HIV testing', displayOrder: 1 },
    { facilityType: 'hospital', categoryCode: 'TRC', name: 'Campaign (All)', displayOrder: 2 },
    { facilityType: 'hospital', categoryCode: 'TRC', name: 'Training', displayOrder: 3 },
    { facilityType: 'hospital', categoryCode: 'TRC', name: 'Supervision (All)', displayOrder: 4 },
    { facilityType: 'hospital', categoryCode: 'TRC', name: 'Workshop (Transport & Perdiem)', displayOrder: 5 },
    { facilityType: 'hospital', categoryCode: 'TRC', name: 'Meeting', displayOrder: 6 },
    { facilityType: 'hospital', categoryCode: 'TRC', name: 'Transport', displayOrder: 7 },

    // Health Products & Equipment (HPE)
    { facilityType: 'hospital', categoryCode: 'HPE', name: 'Maintenance', displayOrder: 1 },

    // Program Administration Costs (PA)
    { facilityType: 'hospital', categoryCode: 'PA', name: 'Bank charges & commissions', displayOrder: 1 },
    { facilityType: 'hospital', categoryCode: 'PA', name: 'Fuel', displayOrder: 2 },
    { facilityType: 'hospital', categoryCode: 'PA', name: 'Communication (Airtime)', displayOrder: 3 },
    { facilityType: 'hospital', categoryCode: 'PA', name: 'Communication (Internet)', displayOrder: 4 },

    // Health Center Activities
    // Human Resources
    { facilityType: 'health_center', categoryCode: 'HR', name: 'HC Nurses (A1) Salary', displayOrder: 1 },
    { facilityType: 'health_center', categoryCode: 'HR', name: 'HC Lab Technician (A1) Salary', displayOrder: 2 },
    { facilityType: 'health_center', categoryCode: 'HR', name: 'Bonus (All staff paid on GF)', displayOrder: 3 },

    // TRC
    { facilityType: 'health_center', categoryCode: 'TRC', name: 'Workshop', displayOrder: 1 },
    { facilityType: 'health_center', categoryCode: 'TRC', name: 'Supervision (CHWs)', displayOrder: 2 },
    { facilityType: 'health_center', categoryCode: 'TRC', name: 'Supervision (Home Visit)', displayOrder: 3 },
    { facilityType: 'health_center', categoryCode: 'TRC', name: 'Transport', displayOrder: 4 },

    // HPE
    { facilityType: 'health_center', categoryCode: 'HPE', name: 'Maintenance and Repair', displayOrder: 1 },

    // PA
    { facilityType: 'health_center', categoryCode: 'PA', name: 'Communication', displayOrder: 1 },
    { facilityType: 'health_center', categoryCode: 'PA', name: 'Office Supplies', displayOrder: 2 },
    { facilityType: 'health_center', categoryCode: 'PA', name: 'Transport (Mission & Reporting Fee)', displayOrder: 3 },
    { facilityType: 'health_center', categoryCode: 'PA', name: 'Bank charges', displayOrder: 4 },
  ],

  // ---------------- MALARIA PROGRAM ----------------
  MAL: [
    // Hospital & Health Center Activities (Malaria program doesn't distinguish by facility type in the frontend)
    // Epidemiology
    { facilityType: 'hospital', categoryCode: 'EPID', name: 'Participants at DHs staff', displayOrder: 1 },
    { facilityType: 'health_center', categoryCode: 'EPID', name: 'Participants at DHs staff', displayOrder: 1 },
    { facilityType: 'hospital', categoryCode: 'EPID', name: 'Provide Perdiem to Health Centers staff', displayOrder: 2 },
    { facilityType: 'health_center', categoryCode: 'EPID', name: 'Provide Perdiem to Health Centers staff', displayOrder: 2 },
    { facilityType: 'hospital', categoryCode: 'EPID', name: 'Provide Mineral water to participants', displayOrder: 3 },
    { facilityType: 'health_center', categoryCode: 'EPID', name: 'Provide Mineral water to participants', displayOrder: 3 },
    { facilityType: 'hospital', categoryCode: 'EPID', name: 'Transport fees for remote distance based HCs staff', displayOrder: 4 },
    { facilityType: 'health_center', categoryCode: 'EPID', name: 'Transport fees for remote distance based HCs staff', displayOrder: 4 },
    { facilityType: 'hospital', categoryCode: 'EPID', name: 'Bank Charges', displayOrder: 5 },
    { facilityType: 'health_center', categoryCode: 'EPID', name: 'Bank Charges', displayOrder: 5 },

    // Program Management
    { facilityType: 'hospital', categoryCode: 'PM', name: 'Running costs', displayOrder: 1 },
    { facilityType: 'health_center', categoryCode: 'PM', name: 'Running costs', displayOrder: 1 },

    // Human Resources
    // { facilityType: 'hospital', categoryCode: 'HR', name: 'Supervisor Salary', displayOrder: 1 },
    { facilityType: 'hospital', categoryCode: 'HR', name: 'DH CHWs supervisors A0', displayOrder: 1 },
    { facilityType: 'hospital', categoryCode: 'HR', name: 'DH Lab technicians', displayOrder: 2 },
    { facilityType: 'hospital', categoryCode: 'HR', name: 'DH Nurses A1', displayOrder: 3 },
    { facilityType: 'hospital', categoryCode: 'HR', name: 'CHW supervisor, lab techs, 2 Nurses', displayOrder: 4 },
    
    // { facilityType: 'health_center', categoryCode: 'HR', name: 'Supervisor Salary', displayOrder: 1 },
    { facilityType: 'health_center', categoryCode: 'HR', name: 'DH CHWs supervisors A0', displayOrder: 1 },
    { facilityType: 'health_center', categoryCode: 'HR', name: 'DH Lab technicians', displayOrder: 2 },
    { facilityType: 'health_center', categoryCode: 'HR', name: 'DH Nurses A1', displayOrder: 3 },
    { facilityType: 'health_center', categoryCode: 'HR', name: 'CHW supervisor, lab techs, 2 Nurses', displayOrder: 4 },
    
  ],

  // ---------------- TB PROGRAM ----------------
  TB: [
    // Human Resources (HR)
    { facilityType: 'hospital', categoryCode: 'HR', name: 'Provincial TB Coordinator Salary', displayOrder: 1 },
    { facilityType: 'hospital', categoryCode: 'HR', name: 'Provincial TB Coordinator Bonus', displayOrder: 2 },
    { facilityType: 'health_center', categoryCode: 'HR', name: 'Provincial TB Coordinator Salary', displayOrder: 1 },
    { facilityType: 'health_center', categoryCode: 'HR', name: 'Provincial TB Coordinator Bonus', displayOrder: 2 },

    // Travel Related Costs (TRC)
    { facilityType: 'hospital', categoryCode: 'TRC', name: 'Contact Tracing (Perdiem)', displayOrder: 1 },
    { facilityType: 'hospital', categoryCode: 'TRC', name: 'Contact Tracing (Transport)', displayOrder: 2 },
    { facilityType: 'hospital', categoryCode: 'TRC', name: 'Contact Tracing (General)', displayOrder: 3 },
    { facilityType: 'hospital', categoryCode: 'TRC', name: 'TPT Guidelines Mentoring (Mission)', displayOrder: 4 },
    { facilityType: 'hospital', categoryCode: 'TRC', name: 'TPT Guidelines Mentoring (Transport)', displayOrder: 5 },
    { facilityType: 'hospital', categoryCode: 'TRC', name: 'HCW Mentorship HC Level (Mission)', displayOrder: 6 },
    { facilityType: 'hospital', categoryCode: 'TRC', name: 'HCW Mentorship HC Level (Transport)', displayOrder: 7 },
    { facilityType: 'hospital', categoryCode: 'TRC', name: 'HCW Mentorship Community (Mission)', displayOrder: 8 },
    { facilityType: 'hospital', categoryCode: 'TRC', name: 'HCW Mentorship Community (Transport)', displayOrder: 9 },
    { facilityType: 'hospital', categoryCode: 'TRC', name: 'Quarterly Evaluation Meetings (Transport)', displayOrder: 10 },
    { facilityType: 'hospital', categoryCode: 'TRC', name: 'Quarterly Evaluation Meetings (Allowance)', displayOrder: 11 },
    
    { facilityType: 'health_center', categoryCode: 'TRC', name: 'Contact Tracing (Perdiem)', displayOrder: 1 },
    { facilityType: 'health_center', categoryCode: 'TRC', name: 'Contact Tracing (Transport)', displayOrder: 2 },
    { facilityType: 'health_center', categoryCode: 'TRC', name: 'Contact Tracing (General)', displayOrder: 3 },
    { facilityType: 'health_center', categoryCode: 'TRC', name: 'TPT Guidelines Mentoring (Mission)', displayOrder: 4 },
    { facilityType: 'health_center', categoryCode: 'TRC', name: 'TPT Guidelines Mentoring (Transport)', displayOrder: 5 },
    { facilityType: 'health_center', categoryCode: 'TRC', name: 'HCW Mentorship HC Level (Mission)', displayOrder: 6 },
    { facilityType: 'health_center', categoryCode: 'TRC', name: 'HCW Mentorship HC Level (Transport)', displayOrder: 7 },
    { facilityType: 'health_center', categoryCode: 'TRC', name: 'HCW Mentorship Community (Mission)', displayOrder: 8 },
    { facilityType: 'health_center', categoryCode: 'TRC', name: 'HCW Mentorship Community (Transport)', displayOrder: 9 },
    { facilityType: 'health_center', categoryCode: 'TRC', name: 'Quarterly Evaluation Meetings (Transport)', displayOrder: 10 },
    { facilityType: 'health_center', categoryCode: 'TRC', name: 'Quarterly Evaluation Meetings (Allowance)', displayOrder: 11 },

    // Program Administration Costs (PA)
    { facilityType: 'hospital', categoryCode: 'PA', name: 'Hospital Running Costs', displayOrder: 1 },
    { facilityType: 'health_center', categoryCode: 'PA', name: 'Hospital Running Costs', displayOrder: 1 },
    { facilityType: 'hospital', categoryCode: 'PA', name: 'Bank charges', displayOrder: 2 },
    { facilityType: 'health_center', categoryCode: 'PA', name: 'Bank charges', displayOrder: 2 },
    { facilityType: 'hospital', categoryCode: 'PA', name: 'Office Supplies', displayOrder: 3 },
    { facilityType: 'health_center', categoryCode: 'PA', name: 'Office Supplies', displayOrder: 3 },
  ]
};

// Category code to display name mapping for different programs
const categoryDisplayNames: Record<string, Record<string, string>> = {
  HIV: {
    'HR': 'Human Resources (HR)',
    'TRC': 'Travel Related Costs (TRC)',
    'HPE': 'Health Products & Equipment (HPE)',
    'PA': 'Program Administration Costs (PA)'
  },
  MALARIA: {
    'EPID': 'Epidemiology',
    'PM': 'Program Management',
    'HR': 'Human Resources'
  },
  TB: {
    'HR': 'Human Resources (HR)',
    'TRC': 'Travel Related Costs (TRC)',
    'PA': 'Program Administration Costs (PA)'
  }
};

/* eslint-disable no-console */
export async function seedPlanningActivities(
  db: Database,
  projectCode: string = 'HIV',
) {
  console.log(`Seeding planning activities for project ${projectCode}…`);

  // Validate that we have activities for this program
  const activities = programActivities[projectCode];
  if (!activities) {
    console.warn(`No activities defined for program ${projectCode}. Skipping.`);
    return;
  }

  // get project id
  const projRow = await db
    .select({ id: schema.projects.id })
    .from(schema.projects)
    .where(eq(schema.projects.code, projectCode))
    .limit(1);
  const projectId = projRow[0]?.id;
  if (!projectId) throw new Error(`Project ${projectCode} not found.`);

  // fetch categories for project
  const catRows = await db
    .select({ 
      id: schema.planningCategories.id, 
      code: schema.planningCategories.code, 
      facilityType: schema.planningCategories.facilityType 
    })
    .from(schema.planningCategories)
    .where(eq(schema.planningCategories.projectId, projectId));

  const catMap = new Map<string, number>(); // key = facilityType|code
  catRows.forEach((c) => catMap.set(`${c.facilityType}|${c.code}`, c.id));

  const rows = activities.reduce<Array<{
    categoryId: number;
    facilityType: 'hospital' | 'health_center';
    name: string;
    displayOrder: number;
    isTotalRow: boolean;
    projectId: number;
  }>>((acc, a) => {
    const categoryId = catMap.get(`${a.facilityType}|${a.categoryCode}`);
    if (!categoryId) {
      console.warn(`Category ${a.categoryCode} for ${a.facilityType} not found in project ${projectCode}. Skipping activity: ${a.name}`);
      return acc;
    }
    acc.push({
      categoryId,
      facilityType: a.facilityType,
      name: a.name,
      displayOrder: a.displayOrder,
      isTotalRow: a.isTotalRow ?? false,
      projectId,
    });
    return acc;
  }, []);

  if (rows.length > 0) {
    await db.insert(schema.planningActivities).values(rows).onConflictDoNothing();
    console.log(`Seeded ${rows.length} planning activities for ${projectCode}.`);
  } else {
    console.warn(`No valid activities to seed for ${projectCode}.`);
  }
}

// Function to seed all programs
export async function seedAllProgramActivities(db: Database) {
  const programs = Object.keys(programActivities);
  console.log(`Seeding activities for ${programs.length} programs: ${programs.join(', ')}`);
  
  for (const program of programs) {
    try {
      await seedPlanningActivities(db, program);
    } catch (error) {
      console.error(`Failed to seed activities for ${program}:`, error);
    }
  }
}

// Default export maintains backward compatibility
export default async function seed(db: Database) {
  await seedPlanningActivities(db, 'HIV');
  await seedPlanningActivities(db, 'MAL');
  await seedPlanningActivities(db, 'TB');
}
