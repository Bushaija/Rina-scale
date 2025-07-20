#!/usr/bin/env node

import { Command } from 'commander';
import DatabaseOperations from './crud-operations-fixed';
import AdvancedOperations from './advanced-operations';
import Examples from './usage-examples';

const program = new Command();

// ============================================================================
// CLI SETUP
// ============================================================================

program
  .name('db-cli')
  .description('Healthcare Financial Management Database CLI')
  .version('1.0.0');

// ============================================================================
// PROJECT COMMANDS
// ============================================================================

program
  .command('project:create')
  .description('Create a new project')
  .requiredOption('-n, --name <name>', 'Project name')
  .requiredOption('-c, --code <code>', 'Project code')
  .option('-d, --description <description>', 'Project description')
  .option('-t, --type <type>', 'Project type (HIV, Malaria, TB)', 'HIV')
  .action(async (options) => {
    try {
      const result = await DatabaseOperations.projects.create({
        name: options.name,
        code: options.code,
        description: options.description,
        projectType: options.type as 'HIV' | 'Malaria' | 'TB',
      });

      if (result.success) {
        console.log('✅ Project created successfully:', result.data);
      } else {
        console.error('❌ Failed to create project:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

program
  .command('project:list')
  .description('List all projects')
  .option('-s, --status <status>', 'Filter by status (ACTIVE, INACTIVE, ARCHIVED)')
  .option('-t, --type <type>', 'Filter by project type (HIV, Malaria, TB)')
  .option('-c, --code <code>', 'Filter by project code')
  .action(async (options) => {
    try {
      const filters: any = {};
      if (options.status) filters.status = options.status;
      if (options.type) filters.projectType = options.type;
      if (options.code) filters.code = options.code;

      const result = await DatabaseOperations.projects.getAll(filters);

      if (result.success && result.data) {
        console.log('📋 Projects:');
        result.data.forEach((project: any) => {
          console.log(`  - ${project.name} (${project.code}) - ${project.projectType} - ${project.status}`);
        });
        console.log(`\nTotal: ${result.data.length} projects`);
      } else {
        console.error('❌ Failed to retrieve projects:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

program
  .command('project:get')
  .description('Get project by ID')
  .requiredOption('-i, --id <id>', 'Project ID')
  .action(async (options) => {
    try {
      const result = await DatabaseOperations.projects.getById(parseInt(options.id));

      if (result.success) {
        console.log('📋 Project Details:');
        console.log(JSON.stringify(result.data, null, 2));
      } else {
        console.error('❌ Failed to retrieve project:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// ============================================================================
// FACILITY COMMANDS
// ============================================================================

program
  .command('facility:create')
  .description('Create a new facility')
  .requiredOption('-n, --name <name>', 'Facility name')
  .requiredOption('-t, --type <type>', 'Facility type (hospital, health_center)')
  .requiredOption('-d, --district <district>', 'District ID')
  .action(async (options) => {
    try {
      const result = await DatabaseOperations.facilities.create({
        name: options.name,
        facilityType: options.type as 'hospital' | 'health_center',
        districtId: parseInt(options.district),
      });

      if (result.success) {
        console.log('✅ Facility created successfully:', result.data);
      } else {
        console.error('❌ Failed to create facility:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

program
  .command('facility:list')
  .description('List all facilities')
  .option('-t, --type <type>', 'Filter by facility type (hospital, health_center)')
  .option('-d, --district <district>', 'Filter by district ID')
  .option('-n, --name <name>', 'Filter by facility name')
  .action(async (options) => {
    try {
      const filters: any = {};
      if (options.type) filters.facilityType = options.type;
      if (options.district) filters.districtId = parseInt(options.district);
      if (options.name) filters.name = options.name;

      const result = await DatabaseOperations.facilities.getAll(filters);

      if (result.success && result.data) {
        console.log('🏥 Facilities:');
        result.data.forEach(facility => {
          console.log(`  - ${facility.name} (${facility.facilityType}) - ${facility.districtName}, ${facility.provinceName}`);
        });
        console.log(`\nTotal: ${result.data.length} facilities`);
      } else {
        console.error('❌ Failed to retrieve facilities:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// ============================================================================
// PLANNING DATA COMMANDS
// ============================================================================

program
  .command('planning:create')
  .description('Create planning data')
  .requiredOption('-a, --activity <activity>', 'Activity ID')
  .requiredOption('-f, --facility <facility>', 'Facility ID')
  .requiredOption('-r, --reporting-period <period>', 'Reporting Period ID')
  .requiredOption('-p, --project <project>', 'Project ID')
  .requiredOption('--frequency <frequency>', 'Frequency')
  .requiredOption('--unit-cost <cost>', 'Unit cost')
  .option('--q1 <q1>', 'Q1 count', '0')
  .option('--q2 <q2>', 'Q2 count', '0')
  .option('--q3 <q3>', 'Q3 count', '0')
  .option('--q4 <q4>', 'Q4 count', '0')
  .option('--comment <comment>', 'Comment')
  .action(async (options) => {
    try {
      const result = await DatabaseOperations.planningData.create({
        activityId: parseInt(options.activity),
        facilityId: parseInt(options.facility),
        reportingPeriodId: parseInt(options.reportingPeriod),
        projectId: parseInt(options.project),
        frequency: options.frequency,
        unitCost: options.unitCost,
        countQ1: parseInt(options.q1),
        countQ2: parseInt(options.q2),
        countQ3: parseInt(options.q3),
        countQ4: parseInt(options.q4),
        comment: options.comment,
      });

      if (result.success) {
        console.log('✅ Planning data created successfully:', result.data);
      } else {
        console.error('❌ Failed to create planning data:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

program
  .command('planning:list')
  .description('List planning data for facility and reporting period')
  .requiredOption('-f, --facility <facility>', 'Facility ID')
  .requiredOption('-r, --reporting-period <period>', 'Reporting Period ID')
  .option('-p, --project <project>', 'Project ID')
  .action(async (options) => {
    try {
      const result = await DatabaseOperations.planningData.getByFacilityAndPeriod(
        parseInt(options.facility),
        parseInt(options.reportingPeriod),
        options.project ? parseInt(options.project) : undefined
      );

      if (result.success && result.data) {
        console.log('📊 Planning Data:');
        result.data.forEach(item => {
          console.log(`  - ${item.activityName} (${item.categoryName})`);
          console.log(`    Q1: ${item.countQ1} × ${item.unitCost} = ${item.amountQ1}`);
          console.log(`    Q2: ${item.countQ2} × ${item.unitCost} = ${item.amountQ2}`);
          console.log(`    Q3: ${item.countQ3} × ${item.unitCost} = ${item.amountQ3}`);
          console.log(`    Q4: ${item.countQ4} × ${item.unitCost} = ${item.amountQ4}`);
          console.log(`    Total: ${item.totalBudget}`);
          console.log('');
        });
        console.log(`Total: ${result.data.length} planning records`);
      } else {
        console.error('❌ Failed to retrieve planning data:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// ============================================================================
// EXECUTION DATA COMMANDS
// ============================================================================

program
  .command('execution:create')
  .description('Create execution data')
  .requiredOption('-f, --facility <facility>', 'Facility ID')
  .requiredOption('-p, --project <project>', 'Project ID')
  .option('-a, --activity <activity>', 'Activity ID')
  .option('-r, --reporting-period <period>', 'Reporting Period ID')
  .option('--q1 <q1>', 'Q1 amount', '0.00')
  .option('--q2 <q2>', 'Q2 amount', '0.00')
  .option('--q3 <q3>', 'Q3 amount', '0.00')
  .option('--q4 <q4>', 'Q4 amount', '0.00')
  .option('--comment <comment>', 'Comment')
  .option('--created-by <user>', 'Created by user')
  .action(async (options) => {
    try {
      const result = await DatabaseOperations.executionData.create({
        facilityId: parseInt(options.facility),
        projectId: parseInt(options.project),
        activityId: options.activity ? parseInt(options.activity) : undefined,
        reportingPeriodId: options.reportingPeriod ? parseInt(options.reportingPeriod) : undefined,
        q1Amount: options.q1,
        q2Amount: options.q2,
        q3Amount: options.q3,
        q4Amount: options.q4,
        comment: options.comment,
        createdBy: options.createdBy,
      });

      if (result.success) {
        console.log('✅ Execution data created successfully:', result.data);
      } else {
        console.error('❌ Failed to create execution data:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

program
  .command('execution:list')
  .description('List execution data for facility and reporting period')
  .requiredOption('-f, --facility <facility>', 'Facility ID')
  .requiredOption('-r, --reporting-period <period>', 'Reporting Period ID')
  .option('-p, --project <project>', 'Project ID')
  .action(async (options) => {
    try {
      const result = await DatabaseOperations.executionData.getByFacilityAndPeriod(
        parseInt(options.facility),
        parseInt(options.reportingPeriod),
        options.project ? parseInt(options.project) : undefined
      );

      if (result.success && result.data) {
        console.log('📈 Execution Data:');
        result.data.forEach(item => {
          console.log(`  - ${item.activityName} (${item.categoryName})`);
          console.log(`    Q1: ${item.q1Amount}`);
          console.log(`    Q2: ${item.q2Amount}`);
          console.log(`    Q3: ${item.q3Amount}`);
          console.log(`    Q4: ${item.q4Amount}`);
          console.log(`    Cumulative: ${item.cumulativeBalance}`);
          console.log('');
        });
        console.log(`Total: ${result.data.length} execution records`);
      } else {
        console.error('❌ Failed to retrieve execution data:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// ============================================================================
// REPORTING COMMANDS
// ============================================================================

program
  .command('report:planning-vs-execution')
  .description('Generate planning vs execution comparison report')
  .requiredOption('-f, --facility <facility>', 'Facility ID')
  .requiredOption('-r, --reporting-period <period>', 'Reporting Period ID')
  .requiredOption('-p, --project <project>', 'Project ID')
  .action(async (options) => {
    try {
      const result = await AdvancedOperations.reporting.getPlanningVsExecution(
        parseInt(options.facility),
        parseInt(options.reportingPeriod),
        parseInt(options.project)
      );

      if (result.success && result.data) {
        console.log('📊 Planning vs Execution Report:');
        result.data.forEach((item: any) => {
          console.log(`\n${item.activityName} (${item.categoryName})`);
          console.log(`  Planned: $${item.plannedTotal}`);
          console.log(`  Executed: $${item.executedTotal}`);
          console.log(`  Variance: $${item.varianceTotal} (${item.variancePercentage.toFixed(2)}%)`);
        });

        const totalVariance = result.data.reduce((sum, item) => sum + (item.varianceTotal || 0), 0);
        console.log(`\n📈 Total Variance: $${totalVariance.toLocaleString()}`);
      } else {
        console.error('❌ Failed to generate report:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

program
  .command('report:facility-performance')
  .description('Generate facility performance summary')
  .requiredOption('-f, --facility <facility>', 'Facility ID')
  .requiredOption('-r, --reporting-period <period>', 'Reporting Period ID')
  .action(async (options) => {
    try {
      const result = await AdvancedOperations.reporting.getFacilityPerformanceSummary(
        parseInt(options.facility),
        parseInt(options.reportingPeriod)
      );

      if (result.success) {
        console.log('📊 Facility Performance Summary:');
        console.log(JSON.stringify(result.data, null, 2));
      } else {
        console.error('❌ Failed to generate report:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// ============================================================================
// BULK OPERATIONS COMMANDS
// ============================================================================

program
  .command('bulk:create-planning')
  .description('Bulk create planning data from template')
  .requiredOption('-f, --facilities <facilities>', 'Comma-separated facility IDs')
  .requiredOption('-r, --reporting-period <period>', 'Reporting Period ID')
  .requiredOption('-p, --project <project>', 'Project ID')
  .requiredOption('-c, --category <category>', 'Category code')
  .requiredOption('-a, --activities <activities>', 'JSON string of activities array')
  .action(async (options) => {
    try {
      const facilityIds = options.facilities.split(',').map((id: string) => parseInt(id.trim()));
      const activities = JSON.parse(options.activities);

      const result = await AdvancedOperations.bulk.bulkCreateFromTemplate({
        facilityIds,
        reportingPeriodId: parseInt(options.reportingPeriod),
        projectId: parseInt(options.project),
        template: {
          categoryCode: options.category,
          activities,
        },
      });

      if (result.success && result.data) {
        console.log('✅ Bulk creation completed successfully');
        console.log(`📊 Created ${result.data.length} planning data records`);
        
        if (result.errors) {
          console.log(`⚠️ ${result.errors.length} errors occurred:`);
          result.errors.forEach(error => console.log(`  - ${error}`));
        }
      } else {
        console.error('❌ Failed to bulk create planning data:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// ============================================================================
// VALIDATION COMMANDS
// ============================================================================

program
  .command('validate:integrity')
  .description('Validate data integrity')
  .action(async () => {
    try {
      const result = await AdvancedOperations.validation.validateDataIntegrity();

      if (result.success && result.data) {
        console.log('🔍 Data Integrity Validation Results:');
        console.log(JSON.stringify(result.data, null, 2));
        
        if (result.data.issues.length > 0) {
          console.log('\n⚠️ Issues found:');
          result.data.issues.forEach(issue => console.log(`  - ${issue}`));
        } else {
          console.log('\n✅ No data integrity issues found');
        }
      } else {
        console.error('❌ Failed to validate data integrity:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

program
  .command('validate:cleanup')
  .description('Clean up orphaned and duplicate data')
  .action(async () => {
    try {
      console.log('🧹 Starting data cleanup...');

      // Clean up orphaned data
      const orphanedResult = await AdvancedOperations.validation.cleanupOrphanedData();
      if (orphanedResult.success && orphanedResult.data) {
        console.log(`✅ Cleaned up ${orphanedResult.data.cleanedCount} orphaned records`);
      }

      // Remove duplicate data
      const duplicateResult = await AdvancedOperations.validation.removeDuplicateData();
      if (duplicateResult.success && duplicateResult.data) {
        console.log(`✅ Removed ${duplicateResult.data.removedCount} duplicate records`);
      }

      console.log('🎉 Data cleanup completed');
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// ============================================================================
// UTILITY COMMANDS
// ============================================================================

program
  .command('stats')
  .description('Get database statistics')
  .action(async () => {
    try {
      const result = await DatabaseOperations.utilities.getDatabaseStats();

      if (result.success && result.data) {
        console.log('📊 Database Statistics:');
        console.log(`  - Projects: ${result.data.projects[0]?.count || 0}`);
        console.log(`  - Facilities: ${result.data.facilities[0]?.count || 0}`);
        console.log(`  - Planning Categories: ${result.data.planningCategories[0]?.count || 0}`);
        console.log(`  - Planning Activities: ${result.data.planningActivities[0]?.count || 0}`);
        console.log(`  - Planning Data: ${result.data.planningData[0]?.count || 0}`);
        console.log(`  - Execution Data: ${result.data.executionData[0]?.count || 0}`);
        console.log(`  - Activity Templates: ${result.data.activityTemplates[0]?.count || 0}`);
      } else {
        console.error('❌ Failed to get database stats:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// ============================================================================
// EXAMPLE COMMANDS
// ============================================================================

program
  .command('examples:run')
  .description('Run comprehensive examples')
  .action(async () => {
    try {
      console.log('🚀 Running comprehensive examples...');
      await Examples.comprehensive.runFullExample();
    } catch (error) {
      console.error('❌ Error running examples:', error);
      process.exit(1);
    }
  });

program
  .command('examples:projects')
  .description('Run project examples')
  .action(async () => {
    try {
      console.log('🚀 Running project examples...');
      await Examples.crud.projectExamples();
    } catch (error) {
      console.error('❌ Error running project examples:', error);
      process.exit(1);
    }
  });

// ============================================================================
// HELP COMMANDS
// ============================================================================

program
  .command('help:examples')
  .description('Show usage examples')
  .action(() => {
    console.log(`
📚 Database CLI Usage Examples:

🔹 Create a new project:
   db-cli project:create -n "HIV Program 2024" -c "HIV2024" -t "HIV"

🔹 List all projects:
   db-cli project:list
   db-cli project:list -s ACTIVE -t HIV

🔹 Create a facility:
   db-cli facility:create -n "Central Hospital" -t "hospital" -d 1

🔹 List facilities:
   db-cli facility:list
   db-cli facility:list -t hospital

🔹 Create planning data:
   db-cli planning:create -a 1 -f 1 -r 1 -p 1 --frequency "12" --unit-cost "75000" --q1 1 --q2 1 --q3 1 --q4 1

🔹 List planning data:
   db-cli planning:list -f 1 -r 1 -p 1

🔹 Create execution data:
   db-cli execution:create -f 1 -p 1 -a 1 --q1 "225000" --q2 "225000" --q3 "225000" --q4 "225000"

🔹 Generate reports:
   db-cli report:planning-vs-execution -f 1 -r 1 -p 1
   db-cli report:facility-performance -f 1 -r 1

🔹 Bulk operations:
   db-cli bulk:create-planning -f "1,2,3" -r 1 -p 1 -c "HR" -a '[{"name":"Doctor Salary","frequency":12,"unitCost":75000}]'

🔹 Validation:
   db-cli validate:integrity
   db-cli validate:cleanup

🔹 Utilities:
   db-cli stats
   db-cli examples:run

🔹 Get help:
   db-cli --help
   db-cli <command> --help
    `);
  });

// ============================================================================
// RUN CLI
// ============================================================================

if (require.main === module) {
  // Handle the case where --help is passed as a separate argument
  const args = process.argv.slice(2);
  if (args.includes('--help') && args.length === 1) {
    program.help();
  } else {
    program.parse();
  }
} 