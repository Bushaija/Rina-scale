// src/db/seeds/facilities.ts
import type { Database } from "@/db";
import * as schema from "@/db/schema";
import facilityData from "./data/facilities.json";
import hospitalDistrictMap from "./data/hospital-district-mapping.json";

export default async function seed(db: Database) {
    console.log("Seeding facilities...");

    const districts = await db.query.districts.findMany();
    const districtMap = new Map(districts.map(d => [d.name, d.id]));

    const facilities = facilityData.flatMap(group => {
        const hospitalKey = group.hospitals[0]?.trim().toLowerCase();
        const districtName = hospitalDistrictMap[hospitalKey as keyof typeof hospitalDistrictMap];
        const districtId = districtMap.get(districtName);

        if (!districtId) {
            console.warn(`Skipping group "${hospitalKey}" - district not found`);
            return [];
        }

        return [
            ...group.hospitals.map(name => ({ 
                name: name.trim(), 
                facilityType: "hospital" as const, 
                districtId 
            })),
            ...group["health-centers"].map(name => ({ 
                name: name.trim(), 
                facilityType: "health_center" as const, 
                districtId 
            }))
        ];
    });

    if (facilities.length > 0) {
        await db.insert(schema.facilities).values(facilities).onConflictDoNothing();
        console.log(`Seeded ${facilities.length} facilities.`);
    }
}