// src/db/seeds/index.ts
import db from "@/db";
import provincesDistricts from "./provinces-districts";
import facilities from "./facilities";
import categories from "./categories";
import subCategories from "./sub-categories";
import activities from "./activities";
import reportingPeriods from "./reporting-periods";
import events from "./events";
import statementTemplatesSeeder from "./statement-templates";
import activityEventMappings from "./activity-event-mappings";
import projects from "./projects";
import planningCategories from "./planning_categories";
import planningActivities from "./planning_activities";
import planningActivityEventMappings from "./planning-activity-event-mappings";
import users from "./users";

const seeders = [
    { name: "Provinces & Districts", fn: provincesDistricts },
    { name: "Facilities", fn: facilities },
    { name: "Users", fn: users },
    { name: "Projects", fn: projects },
    { name: "Categories", fn: categories },
    { name: "Sub-Categories", fn: subCategories },
    { name: "Planning Categories", fn: planningCategories },
    { name: "Planning Activities", fn: planningActivities },
    { name: "Activities", fn: activities },
    { name: "Reporting Periods", fn: reportingPeriods },
    { name: "Events", fn: events },
    { name: "Statement Templates", fn: statementTemplatesSeeder },
    { name: "Activity → Event Mappings", fn: activityEventMappings },
    { name: "Planning Activity → Event Mappings", fn: planningActivityEventMappings },
];

async function runSeeds() {
    try {
        console.log("Starting database seeding...");
        
        for (const seeder of seeders) {
            console.log(`Running ${seeder.name} seeder...`);
            await seeder.fn(db);
        }
        
        console.log("Database seeding completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error during seeding:", error);
        process.exit(1);
    }
}

runSeeds();