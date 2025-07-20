# Database Operations Scripts

This directory contains comprehensive scripts for performing CRUD operations and advanced database management tasks for the healthcare financial management system.

## 📁 File Structure

```
db/scripts/
├── crud-operations.ts      # Basic CRUD operations for all entities
├── advanced-operations.ts  # Advanced operations (migration, reporting, bulk ops)
├── usage-examples.ts       # Practical examples of how to use the scripts
└── README.md              # This file
```

## 🚀 Quick Start

### Import the Operations

```typescript
import DatabaseOperations from '@/db/scripts/crud-operations';
import AdvancedOperations from '@/db/scripts/advanced-operations';
```

### Basic Usage

```typescript
// Create a new project
const project = await DatabaseOperations.projects.create({
  name: 'HIV Prevention Program 2024',
  code: 'HIV2024',
  projectType: 'HIV',
});

// Get all facilities
const facilities = await DatabaseOperations.facilities.getAll({
  facilityType: 'hospital',
});

// Create planning data
const planningData = await DatabaseOperations.planningData.create({
  activityId: 1,
  facilityId: 1,
  reportingPeriodId: 1,
  projectId: 1,
  frequency: 12,
  unitCost: 75000,
});
```

## 📋 Available Operations

### 1. Project Operations
- `create(params)` - Create a new project
- `getAll(filters?)` - Get all projects with optional filters
- `getById(id)` - Get project by ID
- `update(id, updates)` - Update project
- `delete(id)` - Soft delete project (set status to ARCHIVED)

### 2. Facility Operations
- `create(params)` - Create a new facility
- `getAll(filters?)` - Get all facilities with optional filters
- `getById(id)` - Get facility with district and province info
- `update(id, updates)` - Update facility
- `delete(id)` - Delete facility

### 3. Planning Categories Operations (Current System)
- `create(params)` - Create a new planning category
- `getByProject(projectId, facilityType)` - Get categories for a project
- `update(id, updates)` - Update category
- `delete(id)` - Delete category

### 4. Planning Activities Operations (Current System)
- `create(params)` - Create a new planning activity
- `getByCategory(categoryId)` - Get activities for a category
- `getByProject(projectId, facilityType)` - Get all activities for a project
- `update(id, updates)` - Update activity
- `delete(id)` - Delete activity

### 5. Activity Templates Operations (Scalability System)
- `create(params)` - Create a new activity template
- `getAll(filters?)` - Get all templates with optional filters
- `getById(id)` - Get template by ID
- `update(id, updates)` - Update template
- `deactivate(id)` - Soft delete template

### 6. Planning Data Operations
- `create(params)` - Create planning data
- `getByFacilityAndPeriod(facilityId, reportingPeriodId, projectId?)` - Get planning data
- `update(id, updates)` - Update planning data
- `delete(id)` - Delete planning data

### 7. Execution Data Operations
- `create(params)` - Create execution data
- `getByFacilityAndPeriod(facilityId, reportingPeriodId, projectId?)` - Get execution data
- `update(id, updates)` - Update execution data
- `delete(id)` - Delete execution data

## 🔧 Advanced Operations

### 1. Migration Operations
```typescript
// Migrate a project from current to scalability system
const result = await AdvancedOperations.migration.migrateProject(
  projectId,
  'hospital' // facility type
);
```

### 2. Reporting Operations
```typescript
// Generate planning vs execution comparison
const comparison = await AdvancedOperations.reporting.getPlanningVsExecution(
  facilityId,
  reportingPeriodId,
  projectId
);

// Get facility performance summary
const summary = await AdvancedOperations.reporting.getFacilityPerformanceSummary(
  facilityId,
  reportingPeriodId
);
```

### 3. Bulk Operations
```typescript
// Bulk create planning data from template
const result = await AdvancedOperations.bulk.bulkCreateFromTemplate({
  facilityIds: [1, 2, 3],
  reportingPeriodId: 1,
  projectId: 1,
  template: {
    categoryCode: 'HR',
    activities: [
      {
        name: 'Medical Doctor Salary',
        frequency: 12,
        unitCost: 75000,
      },
    ],
  },
});
```

### 4. Validation Operations
```typescript
// Validate data integrity
const integrity = await AdvancedOperations.validation.validateDataIntegrity();

// Clean up orphaned data
const cleanup = await AdvancedOperations.validation.cleanupOrphanedData();
```

## 📊 Data Types

### CreateProjectParams
```typescript
interface CreateProjectParams {
  name: string;
  code: string;
  description?: string;
  projectType?: 'HIV' | 'Malaria' | 'TB';
  facilityId?: number;
  reportingPeriodId?: number;
  userId?: number;
}
```

### CreateFacilityParams
```typescript
interface CreateFacilityParams {
  name: string;
  facilityType: 'hospital' | 'health_center';
  districtId: number;
}
```

### CreatePlanningDataParams
```typescript
interface CreatePlanningDataParams {
  activityId: number;
  facilityId: number;
  reportingPeriodId: number;
  projectId: number;
  frequency: number;
  unitCost: number;
  countQ1?: number;
  countQ2?: number;
  countQ3?: number;
  countQ4?: number;
  comment?: string;
}
```

## 🎯 Common Use Cases

### 1. Setting Up a New Project

```typescript
// 1. Create project
const project = await DatabaseOperations.projects.create({
  name: 'Malaria Control Program',
  code: 'MAL2024',
  projectType: 'Malaria',
});

// 2. Create categories
const categories = ['HR', 'TRC', 'PA', 'HPE'];
for (const code of categories) {
  await DatabaseOperations.planningCategories.create({
    projectId: project.data.id,
    facilityType: 'hospital',
    code,
    name: getCategoryName(code),
    displayOrder: getDisplayOrder(code),
  });
}

// 3. Create activities for each category
// ... (similar pattern for activities)
```

### 2. Bulk Data Import

```typescript
// Import planning data for multiple facilities
const facilities = await DatabaseOperations.facilities.getAll();
const template = {
  categoryCode: 'HR',
  activities: [
    { name: 'Medical Doctor Salary', frequency: 12, unitCost: 75000 },
    { name: 'Nurse Salary', frequency: 12, unitCost: 45000 },
  ],
};

for (const facility of facilities.data) {
  await AdvancedOperations.bulk.bulkCreateFromTemplate({
    facilityIds: [facility.id],
    reportingPeriodId: 1,
    projectId: 1,
    template,
  });
}
```

### 3. Generate Reports

```typescript
// Generate comprehensive report for a facility
const facilityId = 1;
const reportingPeriodId = 1;
const projectId = 1;

// Planning vs Execution
const comparison = await AdvancedOperations.reporting.getPlanningVsExecution(
  facilityId,
  reportingPeriodId,
  projectId
);

// Performance summary
const summary = await AdvancedOperations.reporting.getFacilityPerformanceSummary(
  facilityId,
  reportingPeriodId
);

// Quarterly trends
const trends = await AdvancedOperations.reporting.getQuarterlyTrends(
  facilityId,
  projectId,
  2024
);
```

## 🔍 Error Handling

All operations return a consistent response format:

```typescript
// Success response
{
  success: true,
  data: T, // The actual data
}

// Error response
{
  success: false,
  error: string, // Error message
}
```

### Example Error Handling

```typescript
const result = await DatabaseOperations.projects.create({
  name: 'Test Project',
  code: 'TEST',
});

if (result.success) {
  console.log('Project created:', result.data.name);
} else {
  console.error('Failed to create project:', result.error);
  // Handle error appropriately
}
```

## 🧪 Testing

### Run Examples

```typescript
import Examples from '@/db/scripts/usage-examples';

// Run comprehensive example
await Examples.comprehensive.runFullExample();

// Run specific examples
await Examples.crud.projectExamples();
await Examples.advanced.reportingExamples();
```

### Database Statistics

```typescript
const stats = await DatabaseOperations.utilities.getDatabaseStats();
console.log('Database Statistics:', stats.data);
```

## 🔧 Configuration

### Environment Variables

Make sure your database connection is properly configured in `db/index.ts`:

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);
export const db = drizzle(client);
```

### Schema Imports

The scripts automatically import the correct schemas:

```typescript
import * as schema from "@/db/schema"; // Current system
import * as scalabilitySchema from "@/db/schema/planning-scalability"; // Scalability system
```

## 📈 Performance Tips

1. **Use Bulk Operations**: For large datasets, use bulk operations instead of individual creates
2. **Filter Results**: Always use filters when getting data to limit result sets
3. **Batch Updates**: Group related updates together
4. **Index Usage**: Ensure proper database indexes for frequently queried fields

## 🚨 Important Notes

1. **Transaction Safety**: These operations don't use transactions by default. For critical operations, wrap them in transactions
2. **Data Validation**: Always validate input data before operations
3. **Error Recovery**: Implement proper error recovery mechanisms
4. **Backup**: Always backup your database before running bulk operations

## 🤝 Contributing

When adding new operations:

1. Follow the existing naming conventions
2. Include proper error handling
3. Add TypeScript interfaces for parameters
4. Include usage examples
5. Update this README

## 📞 Support

For issues or questions about these scripts:

1. Check the usage examples in `usage-examples.ts`
2. Review the error messages for debugging
3. Ensure your database schema is up to date
4. Verify your database connection is working 