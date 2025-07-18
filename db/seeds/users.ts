import type { Database } from "@/db";
import * as schema from "@/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

/* eslint-disable no-console */
export default async function seed(db: Database) {
  console.log("Seeding admin user...");

  try {
    // First, find the facility ID for "ruhengeri referral" hospital in "musanze" district
    const facility = await db
      .select({ 
        id: schema.facilities.id,
        name: schema.facilities.name,
        districtName: schema.districts.name 
      })
      .from(schema.facilities)
      .innerJoin(schema.districts, eq(schema.facilities.districtId, schema.districts.id))
      .where(
        and(
          eq(schema.facilities.name, "ruhengeri referral"),
          eq(schema.districts.name, "musanze")
        )
      )
      .limit(1);

    if (!facility || facility.length === 0) {
      console.error("Facility 'ruhengeri referral' in 'musanze' district not found!");
      console.log("Available facilities in musanze district:");
      const musanzeFacilities = await db
        .select({ 
          id: schema.facilities.id,
          name: schema.facilities.name 
        })
        .from(schema.facilities)
        .innerJoin(schema.districts, eq(schema.facilities.districtId, schema.districts.id))
        .where(eq(schema.districts.name, "musanze"));
      
      console.log(musanzeFacilities.map(f => `- ${f.name} (ID: ${f.id})`).join('\n'));
      return;
    }

    const facilityId = facility[0].id;
    console.log(`Found facility: ${facility[0].name} in ${facility[0].districtName} district (ID: ${facilityId})`);

    // Check if admin user already exists
    const existingUser = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, "admin@gmail.com"))
      .limit(1);

    if (existingUser.length > 0) {
      console.log("Admin user already exists, skipping...");
      return;
    }

    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash("kinyarwanda", saltRounds);

    // Create the user record
    const userResult = await db
      .insert(schema.users)
      .values({
        name: "admin",
        email: "admin@gmail.com",
        emailVerified: true,
        role: "admin",
        facilityId: facilityId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: schema.users.id });

    const userId = userResult[0].id;
    console.log(`Created user with ID: ${userId}`);

    // Create the account record for email/password authentication
    await db
      .insert(schema.account)
      .values({
        accountId: "admin@gmail.com",
        providerId: "credential",
        userId: userId,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    console.log("Admin user seeded successfully!");
    console.log("Login credentials:");
    console.log("  Email: admin@gmail.com");
    console.log("  Password: kinyarwanda");
    console.log("  Role: admin");
    console.log(`  Facility: ${facility[0].name} (${facility[0].districtName} district)`);

  } catch (error) {
    console.error("Error seeding admin user:", error);
    throw error;
  }
} 