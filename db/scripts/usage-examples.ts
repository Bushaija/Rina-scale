import DatabaseOperations from './crud-operations';
import AdvancedOperations from './advanced-operations';

// ============================================================================
// CRUD OPERATIONS EXAMPLES
// ============================================================================

export const CRUDExamples = {
  // Project Management Examples
  async projectExamples() {
    console.log('🚀 Project Management Examples');

    // Create a new HIV project
    const newProject = await DatabaseOperations.projects.create({
      name: 'HIV Prevention Program 2024',
      code: 'HIV2024',
      description: 'Comprehensive HIV prevention and treatment program',
      projectType: 'HIV',
    });

    if (newProject.success && newProject.data) {
      console.log('✅ Project created:', newProject.data.name);
    }

    // Get all active projects
    const activeProjects = await DatabaseOperations.projects.getAll({
      status: 'ACTIVE',
    });

    if (activeProjects.success && activeProjects.data) {
      console.log(`✅ Found ${activeProjects.data.length} active projects`);
    }

    // Update project
    if (newProject.success && newProject.data) {
      const updatedProject = await DatabaseOperations.projects.update(
        newProject.data.id,
        { description: 'Updated description for HIV program' }
      );

      if (updatedProject.success) {
        console.log('✅ Project updated successfully');
      }
    }
  },

  // Facility Management Examples
  async facilityExamples() {
    console.log('🏥 Facility Management Examples');

    // Create a new hospital
    const newHospital = await DatabaseOperations.facilities.create({
      name: 'Central District Hospital',
      facilityType: 'hospital',
      districtId: 1, // Assuming district ID 1 exists
    });

    if (newHospital.success && newHospital.data) {
      console.log('✅ Hospital created:', newHospital.data.name);
    }

    // Get all hospitals
    const hospitals = await DatabaseOperations.facilities.getAll({
      facilityType: 'hospital',
    });

    if (hospitals.success && hospitals.data) {
      console.log(`✅ Found ${hospitals.data.length} hospitals`);
    }

    // Get facility with district and province info
    if (newHospital.success && newHospital.data) {
      const facilityDetails = await DatabaseOperations.facilities.getById(
        newHospital.data.id
      );

      if (facilityDetails.success && facilityDetails.data) {
        console.log('✅ Facility details:', {
          name: facilityDetails.data.name,
          district: facilityDetails.data.districtName,
          province: facilityDetails.data.provinceName,
        });
      }
    }
  },

  // Planning Categories Examples
  async planningCategoryExamples() {
    console.log('📋 Planning Categories Examples');

    // Create planning categories for HIV project
    const categories = [
      { code: 'HR', name: 'Human Resources', displayOrder: 1 },
      { code: 'TRC', name: 'Travel Related Costs', displayOrder: 2 },
      { code: 'PA', name: 'Programme Activities', displayOrder: 3 },
      { code: 'HPE', name: 'Health Promotion & Education', displayOrder: 4 },
    ];

    for (const category of categories) {
      const result = await DatabaseOperations.planningCategories.create({
        projectId: 1, // Assuming project ID 1 exists
        facilityType: 'hospital',
        ...category,
      });

      if (result.success) {
        console.log(`✅ Category created: ${category.name}`);
      }
    }

    // Get all categories for a project
    const projectCategories = await DatabaseOperations.planningCategories.getByProject(
      1, // project ID
      'hospital' // facility type
    );

    if (projectCategories.success && projectCategories.data) {
      console.log(`✅ Found ${projectCategories.data.length} categories for project`);
    }
  },

  // Planning Activities Examples
  async planningActivityExamples() {
    console.log('📝 Planning Activities Examples');

    // Create activities for Human Resources category
    const hrActivities = [
      { name: 'Medical Doctor Salary', displayOrder: 1 },
      { name: 'Nurse Salary', displayOrder: 2 },
      { name: 'Laboratory Technician Salary', displayOrder: 3 },
      { name: 'All Staff Bonus', displayOrder: 4, isTotalRow: true },
    ];

    for (const activity of hrActivities) {
      const result = await DatabaseOperations.planningActivities.create({
        categoryId: 1, // Assuming HR category ID is 1
        facilityType: 'hospital',
        projectId: 1, // Assuming project ID 1 exists
        ...activity,
      });

      if (result.success) {
        console.log(`✅ Activity created: ${activity.name}`);
      }
    }

    // Get all activities for a project
    const projectActivities = await DatabaseOperations.planningActivities.getByProject(
      1, // project ID
      'hospital' // facility type
    );

    if (projectActivities.success && projectActivities.data) {
      console.log(`✅ Found ${projectActivities.data.length} activities for project`);
      
      // Group by category
      const activitiesByCategory = projectActivities.data.reduce((acc: Record<string, any[]>, activity: any) => {
        const categoryName = activity.categoryName || 'Unknown';
        if (!acc[categoryName]) {
          acc[categoryName] = [];
        }
        acc[categoryName].push(activity);
        return acc;
      }, {} as Record<string, any[]>);

      console.log('📊 Activities by category:', activitiesByCategory);
    }
  },

  // Activity Templates Examples
  async activityTemplateExamples() {
    console.log('🎯 Activity Templates Examples');

    // Create reusable activity templates
    const templates = [
      {
        name: 'Medical Doctor Salary',
        description: 'Template for medical doctor salary activities',
        categoryType: 'HR',
        tags: ['salary', 'medical', 'staff'],
        metadata: {
          suggestedFrequency: 12,
          costRange: { min: 50000, max: 200000 },
          validationRules: {
            required: true,
            minValue: 0,
            maxValue: 999999,
          },
        },
      },
      {
        name: 'Transport Costs',
        description: 'Template for various transport-related activities',
        categoryType: 'TRC',
        tags: ['transport', 'travel', 'mission'],
        metadata: {
          suggestedFrequency: 4,
          costRange: { min: 100, max: 10000 },
        },
      },
    ];

    for (const template of templates) {
      const result = await DatabaseOperations.activityTemplates.create(template);

      if (result.success) {
        console.log(`✅ Template created: ${template.name}`);
      }
    }

    // Get templates by category type
    const hrTemplates = await DatabaseOperations.activityTemplates.getAll({
      categoryType: 'HR',
      isActive: true,
    });

    if (hrTemplates.success && hrTemplates.data) {
      console.log(`✅ Found ${hrTemplates.data.length} HR templates`);
    }

    // Get templates by tags
    const salaryTemplates = await DatabaseOperations.activityTemplates.getAll({
      tags: ['salary'],
      isActive: true,
    });

    if (salaryTemplates.success && salaryTemplates.data) {
      console.log(`✅ Found ${salaryTemplates.data.length} salary-related templates`);
    }
  },

  // Planning Data Examples
  async planningDataExamples() {
    console.log('📊 Planning Data Examples');

          // Create planning data for multiple activities
      const planningData = [
        {
          activityId: 1, // Medical Doctor Salary
          facilityId: 1, // Assuming facility ID 1 exists
          reportingPeriodId: 1, // Assuming reporting period ID 1 exists
          projectId: 1, // Assuming project ID 1 exists
          frequency: '12', // Monthly
          unitCost: '75000', // $75,000 per month
          countQ1: 1,
          countQ2: 1,
          countQ3: 1,
          countQ4: 1,
          comment: 'Full-time medical doctor position',
        },
        {
          activityId: 2, // Nurse Salary
          facilityId: 1,
          reportingPeriodId: 1,
          projectId: 1,
          frequency: '12',
          unitCost: '45000', // $45,000 per month
          countQ1: 2,
          countQ2: 2,
          countQ3: 2,
          countQ4: 2,
          comment: 'Two full-time nurse positions',
        },
      ];

    for (const data of planningData) {
      const result = await DatabaseOperations.planningData.create(data);

      if (result.success) {
        console.log(`✅ Planning data created for activity ${data.activityId}`);
      }
    }

    // Get planning data for a facility
    const facilityPlanningData = await DatabaseOperations.planningData.getByFacilityAndPeriod(
      1, // facility ID
      1, // reporting period ID
      1  // project ID
    );

    if (facilityPlanningData.success && facilityPlanningData.data) {
      console.log(`✅ Retrieved ${facilityPlanningData.data.length} planning data records`);
      
      // Calculate total budget
      const totalBudget = facilityPlanningData.data.reduce(
        (sum: number, record: any) => sum + parseFloat(record.totalBudget || '0'),
        0
      );
      console.log(`💰 Total planned budget: $${totalBudget.toLocaleString()}`);
    }
  },

  // Execution Data Examples
  async executionDataExamples() {
    console.log('📈 Execution Data Examples');

          // Create execution data
      const executionData = [
        {
          activityId: 1, // Medical Doctor Salary
          facilityId: 1,
          reportingPeriodId: 1,
          projectId: 1,
          q1Amount: '225000', // 3 months × $75,000
          q2Amount: '225000',
          q3Amount: '225000',
          q4Amount: '225000',
          comment: 'Medical doctor salary payments for the year',
          createdBy: 'admin@example.com',
        },
        {
          activityId: 2, // Nurse Salary
          facilityId: 1,
          reportingPeriodId: 1,
          projectId: 1,
          q1Amount: '270000', // 3 months × $45,000 × 2 nurses
          q2Amount: '270000',
          q3Amount: '270000',
          q4Amount: '270000',
          comment: 'Nurse salary payments for the year',
          createdBy: 'admin@example.com',
        },
      ];

    for (const data of executionData) {
      const result = await DatabaseOperations.executionData.create(data);

      if (result.success) {
        console.log(`✅ Execution data created for activity ${data.activityId}`);
      }
    }

    // Get execution data for a facility
    const facilityExecutionData = await DatabaseOperations.executionData.getByFacilityAndPeriod(
      1, // facility ID
      1, // reporting period ID
      1  // project ID
    );

    if (facilityExecutionData.success && facilityExecutionData.data) {
      console.log(`✅ Retrieved ${facilityExecutionData.data.length} execution data records`);
      
      // Calculate total execution
      const totalExecution = facilityExecutionData.data.reduce(
        (sum: number, record: any) => sum + parseFloat(record.cumulativeBalance || '0'),
        0
      );
      console.log(`💰 Total execution: $${totalExecution.toLocaleString()}`);
    }
  },
};

// ============================================================================
// ADVANCED OPERATIONS EXAMPLES
// ============================================================================

export const AdvancedExamples = {
  // Migration Examples
  async migrationExamples() {
    console.log('🔄 Migration Examples');

    // Migrate a project from current to scalability system
    const migrationResult = await AdvancedOperations.migration.migrateProject(
      1, // project ID
      'hospital' // facility type
    );

    if (migrationResult.success && migrationResult.data) {
      console.log('✅ Project migration completed successfully');
      if ('categories' in migrationResult.data && migrationResult.data.categories) {
        console.log(`📊 Migrated ${migrationResult.data.categories.length} categories`);
      }
      if ('activities' in migrationResult.data && migrationResult.data.activities) {
        console.log(`📊 Migrated ${migrationResult.data.activities.length} activities`);
      }
    } else {
      console.error('❌ Migration failed:', (migrationResult as any).error);
    }
  },

  // Reporting Examples
  async reportingExamples() {
    console.log('📊 Reporting Examples');

    // Generate planning vs execution comparison
    const comparison = await AdvancedOperations.reporting.getPlanningVsExecution(
      1, // facility ID
      1, // reporting period ID
      1  // project ID
    );

    if (comparison.success) {
      console.log('✅ Planning vs Execution comparison generated');
      
      if (comparison.data) {
        // Calculate overall variance
        const totalVariance = comparison.data.reduce(
          (sum, item) => sum + (item.varianceTotal || 0),
          0
        );
        
        console.log(`📊 Total variance: $${totalVariance.toLocaleString()}`);
        
        // Show activities with significant variance
        const significantVariance = comparison.data.filter(
          item => Math.abs(item.variancePercentage) > 10
        );
        
        console.log(`⚠️ ${significantVariance.length} activities with >10% variance`);
      }
    }

    // Generate facility performance summary
    const summary = await AdvancedOperations.reporting.getFacilityPerformanceSummary(
      1, // facility ID
      1  // reporting period ID
    );

    if (summary.success) {
      console.log('✅ Facility performance summary generated');
      console.log('📊 Performance metrics:', summary.data);
    }

    // Generate project performance across facilities
    const projectPerformance = await AdvancedOperations.reporting.getProjectPerformance(
      1, // project ID
      1  // reporting period ID
    );

    if (projectPerformance.success && projectPerformance.data) {
      console.log('✅ Project performance report generated');
      console.log(`📊 Performance across ${projectPerformance.data.length} facilities`);
    }
  },

  // Bulk Operations Examples
  async bulkOperationsExamples() {
    console.log('📦 Bulk Operations Examples');

    // Bulk create planning data from template
    const bulkCreateResult = await AdvancedOperations.bulk.bulkCreateFromTemplate({
      facilityIds: [1, 2, 3], // Multiple facilities
      reportingPeriodId: 1,
      projectId: 1,
      template: {
        categoryCode: 'HR',
        activities: [
          {
            name: 'Medical Doctor Salary',
            frequency: 12,
            unitCost: 75000,
            countQ1: 1,
            countQ2: 1,
            countQ3: 1,
            countQ4: 1,
          },
          {
            name: 'Nurse Salary',
            frequency: 12,
            unitCost: 45000,
            countQ1: 2,
            countQ2: 2,
            countQ3: 2,
            countQ4: 2,
          },
        ],
      },
    });

    if (bulkCreateResult.success && bulkCreateResult.data) {
      console.log('✅ Bulk creation completed');
      console.log(`📊 Created ${bulkCreateResult.data.length} planning data records`);
      
      if (bulkCreateResult.errors) {
        console.log(`⚠️ ${bulkCreateResult.errors.length} errors occurred`);
      }
    }

    // Bulk update planning data
    const updates = [
      { id: 1, unitCost: 80000 }, // Increase medical doctor salary
      { id: 2, unitCost: 48000 }, // Increase nurse salary
    ];

    const bulkUpdateResult = await AdvancedOperations.bulk.bulkUpdatePlanningData(updates);

    if (bulkUpdateResult.success && bulkUpdateResult.data) {
      console.log('✅ Bulk update completed');
      console.log(`📊 Updated ${bulkUpdateResult.data.length} planning data records`);
    }
  },

  // Validation Examples
  async validationExamples() {
    console.log('🔍 Validation Examples');

    // Validate data integrity
    const integrityResult = await AdvancedOperations.validation.validateDataIntegrity();

    if (integrityResult.success) {
      console.log('✅ Data integrity validation completed');
      
      if (integrityResult.data && integrityResult.data.issues.length > 0) {
        console.log('⚠️ Data integrity issues found:');
        integrityResult.data.issues.forEach(issue => console.log(`  - ${issue}`));
      } else {
        console.log('✅ No data integrity issues found');
      }
    }

    // Clean up orphaned data
    const cleanupResult = await AdvancedOperations.validation.cleanupOrphanedData();

    if (cleanupResult.success && cleanupResult.data) {
      console.log('✅ Orphaned data cleanup completed');
      console.log(`🧹 Cleaned up ${cleanupResult.data.cleanedCount} orphaned records`);
    }

    // Remove duplicate data
    const duplicateRemovalResult = await AdvancedOperations.validation.removeDuplicateData();

    if (duplicateRemovalResult.success && duplicateRemovalResult.data) {
      console.log('✅ Duplicate data removal completed');
      console.log(`🧹 Removed ${duplicateRemovalResult.data.removedCount} duplicate records`);
    }
  },
};

// ============================================================================
// UTILITY EXAMPLES
// ============================================================================

export const UtilityExamples = {
  // Database statistics
  async databaseStats() {
    console.log('📊 Database Statistics');

    const stats = await DatabaseOperations.utilities.getDatabaseStats();

    if (stats.success && stats.data) {
      console.log('📊 Database Statistics:');
      console.log(`  - Projects: ${stats.data.projects[0]?.count || 0}`);
      console.log(`  - Facilities: ${stats.data.facilities[0]?.count || 0}`);
      console.log(`  - Planning Categories: ${stats.data.planningCategories[0]?.count || 0}`);
      console.log(`  - Planning Activities: ${stats.data.planningActivities[0]?.count || 0}`);
      console.log(`  - Planning Data: ${stats.data.planningData[0]?.count || 0}`);
      console.log(`  - Execution Data: ${stats.data.executionData[0]?.count || 0}`);
      console.log(`  - Activity Templates: ${stats.data.activityTemplates[0]?.count || 0}`);
    }
  },

  // Data validation
  async dataValidation() {
    console.log('🔍 Data Validation');

    const validation = await DatabaseOperations.utilities.validatePlanningData(
      1, // facility ID
      1, // reporting period ID
      1  // project ID
    );

    if (validation.success) {
      console.log('✅ Data validation passed');
    } else {
      console.log('❌ Data validation failed:', validation.issues);
    }
  },
};

// ============================================================================
// COMPREHENSIVE EXAMPLE
// ============================================================================

export const ComprehensiveExample = {
  async runFullExample() {
    console.log('🚀 Running Comprehensive Database Operations Example');
    console.log('=' .repeat(60));

    try {
      // 1. Create a new project
      console.log('\n1️⃣ Creating a new project...');
      const project = await DatabaseOperations.projects.create({
        name: 'TB Treatment Program 2024',
        code: 'TB2024',
        description: 'Comprehensive TB treatment and prevention program',
        projectType: 'TB',
      });

      if (!project.success) {
        throw new Error(`Failed to create project: ${project.error}`);
      }

      // 2. Create a new facility
      console.log('\n2️⃣ Creating a new facility...');
      const facility = await DatabaseOperations.facilities.create({
        name: 'TB Treatment Center',
        facilityType: 'health_center',
        districtId: 1,
      });

      if (!facility.success) {
        throw new Error(`Failed to create facility: ${facility.error}`);
      }

      // 3. Create planning categories
      console.log('\n3️⃣ Creating planning categories...');
      const categories = [
        { code: 'HR', name: 'Human Resources', displayOrder: 1 },
        { code: 'TRC', name: 'Travel Related Costs', displayOrder: 2 },
        { code: 'PA', name: 'Programme Activities', displayOrder: 3 },
      ];

      if (project.success && project.data && facility.success && facility.data) {
        for (const category of categories) {
          const result = await DatabaseOperations.planningCategories.create({
            projectId: project.data.id,
            facilityType: facility.data.facilityType,
            ...category,
          });

          if (!result.success) {
            console.warn(`⚠️ Failed to create category ${category.name}: ${result.error}`);
          }
        }

        // 4. Create planning activities
        console.log('\n4️⃣ Creating planning activities...');
        const activities = [
          { name: 'TB Nurse Salary', displayOrder: 1 },
          { name: 'Patient Transport', displayOrder: 2 },
          { name: 'TB Screening', displayOrder: 3 },
        ];

        for (const activity of activities) {
          const result = await DatabaseOperations.planningActivities.create({
            categoryId: 1, // Assuming first category
            facilityType: facility.data.facilityType,
            projectId: project.data.id,
            ...activity,
          });

          if (!result.success) {
            console.warn(`⚠️ Failed to create activity ${activity.name}: ${result.error}`);
          }
        }

        // 5. Create planning data
        console.log('\n5️⃣ Creating planning data...');
        const planningData = await DatabaseOperations.planningData.create({
          activityId: 1, // Assuming first activity
          facilityId: facility.data.id,
          reportingPeriodId: 1, // Assuming reporting period exists
          projectId: project.data.id,
          frequency: '12',
          unitCost: '50000',
          countQ1: 1,
          countQ2: 1,
          countQ3: 1,
          countQ4: 1,
          comment: 'TB nurse salary for the year',
        });

              if (!planningData.success) {
          console.warn(`⚠️ Failed to create planning data: ${planningData.error}`);
        }

        // 6. Generate reports
        console.log('\n6️⃣ Generating reports...');
        const summary = await AdvancedOperations.reporting.getFacilityPerformanceSummary(
          facility.data.id,
          1 // reporting period ID
        );

        if (summary.success) {
          console.log('📊 Facility Performance Summary:', summary.data);
        }

        // 7. Validate data
        console.log('\n7️⃣ Validating data...');
        const validation = await DatabaseOperations.utilities.validatePlanningData(
          facility.data.id,
          1, // reporting period ID
          project.data.id
        );

        if (validation.success) {
          console.log('✅ Data validation passed');
        } else {
          console.log('❌ Data validation failed:', validation.issues);
        }

        console.log('\n🎉 Comprehensive example completed successfully!');
        console.log('=' .repeat(60));
      }
    } catch (error) {
      console.error('❌ Comprehensive example failed:', (error as any).message);
    }
  },
};

// ============================================================================
// EXPORT ALL EXAMPLES
// ============================================================================

export const Examples = {
  crud: CRUDExamples,
  advanced: AdvancedExamples,
  utility: UtilityExamples,
  comprehensive: ComprehensiveExample,
};

export default Examples; 