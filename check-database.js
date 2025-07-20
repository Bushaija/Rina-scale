// Database check script for Planning Configuration API
// Run this with: node check-database.js

import { db } from './db/index.js';
import * as schema from './db/schema/tables.js';
import * as scalabilitySchema from './db/schema/planning-scalability.js';

async function checkDatabase() {
  console.log('🔍 Checking database state...\n');
  
  try {
    // Check if projects table exists and has data
    console.log('1. Checking projects table...');
    try {
      const projects = await db.select().from(schema.projects).limit(5);
      console.log(`   ✅ Projects table exists with ${projects.length} projects`);
      if (projects.length > 0) {
        console.log('   📋 Available projects:');
        projects.forEach(p => console.log(`      - ID: ${p.id}, Name: ${p.name}, Code: ${p.code}`));
      }
    } catch (error) {
      console.log(`   ❌ Projects table error: ${error.message}`);
    }
    
    // Check if activity_templates table exists and has data
    console.log('\n2. Checking activity_templates table...');
    try {
      const templates = await db.select().from(scalabilitySchema.activityTemplates).limit(5);
      console.log(`   ✅ Activity templates table exists with ${templates.length} templates`);
      if (templates.length > 0) {
        console.log('   📋 Available templates:');
        templates.forEach(t => console.log(`      - ID: ${t.id}, Name: ${t.name}, Category: ${t.categoryType}`));
      }
    } catch (error) {
      console.log(`   ❌ Activity templates table error: ${error.message}`);
    }
    
    // Check if planning_category_versions table exists
    console.log('\n3. Checking planning_category_versions table...');
    try {
      const categories = await db.select().from(scalabilitySchema.planningCategoryVersions).limit(5);
      console.log(`   ✅ Planning category versions table exists with ${categories.length} categories`);
    } catch (error) {
      console.log(`   ❌ Planning category versions table error: ${error.message}`);
    }
    
    // Check if planning_activity_versions table exists
    console.log('\n4. Checking planning_activity_versions table...');
    try {
      const activities = await db.select().from(scalabilitySchema.planningActivityVersions).limit(5);
      console.log(`   ✅ Planning activity versions table exists with ${activities.length} activities`);
    } catch (error) {
      console.log(`   ❌ Planning activity versions table error: ${error.message}`);
    }
    
    // Check specific data for your test request
    console.log('\n5. Checking specific data for test request...');
    
    // Check if project ID 1 exists
    try {
      const project1 = await db.select().from(schema.projects).where(eq(schema.projects.id, 1));
      if (project1.length > 0) {
        console.log('   ✅ Project ID 1 exists');
      } else {
        console.log('   ❌ Project ID 1 does not exist');
      }
    } catch (error) {
      console.log(`   ❌ Error checking project ID 1: ${error.message}`);
    }
    
    // Check if template ID 1 exists
    try {
      const template1 = await db.select().from(scalabilitySchema.activityTemplates).where(eq(scalabilitySchema.activityTemplates.id, 1));
      if (template1.length > 0) {
        console.log('   ✅ Template ID 1 exists');
      } else {
        console.log('   ❌ Template ID 1 does not exist');
      }
    } catch (error) {
      console.log(`   ❌ Error checking template ID 1: ${error.message}`);
    }
    
    console.log('\n📋 Summary:');
    console.log('- If any table shows an error, the migration needs to be run');
    console.log('- If project ID 1 doesn\'t exist, you need to create it or use a different project ID');
    console.log('- If template ID 1 doesn\'t exist, you need to create it or remove templateId from the request');
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.log('\n💡 Possible solutions:');
    console.log('1. Check your DATABASE_URL environment variable');
    console.log('2. Make sure the database is running');
    console.log('3. Run the migration: npm run db:migrate');
  }
}

// Import eq function
import { eq } from 'drizzle-orm';

checkDatabase().catch(console.error); 