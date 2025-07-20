# Database CLI Usage Guide

This guide shows you how to use the database CLI tool to perform CRUD operations and advanced database management tasks from the terminal.

## 🚀 Quick Start

### Installation

First, install the required dependency:

```bash
npm install commander
```

### Running the CLI

```bash
# Using npm script
npm run db:cli -- <command>

# Using tsx directly
npx tsx db/scripts/cli.ts <command>

# Get help
npm run db:cli -- --help
```

## 📋 Available Commands

### Project Management

#### Create a Project
```bash
npm run db:cli -- project:create -n "HIV Prevention Program 2024" -c "HIV2024" -t "HIV"
```

**Options:**
- `-n, --name <name>` - Project name (required)
- `-c, --code <code>` - Project code (required)
- `-d, --description <description>` - Project description (optional)
- `-t, --type <type>` - Project type: HIV, Malaria, TB (default: HIV)

#### List Projects
```bash
# List all projects
npm run db:cli -- project:list

# Filter by status and type
npm run db:cli -- project:list -s ACTIVE -t HIV

# Filter by code
npm run db:cli -- project:list -c HIV2024
```

**Options:**
- `-s, --status <status>` - Filter by status (ACTIVE, INACTIVE, ARCHIVED)
- `-t, --type <type>` - Filter by project type (HIV, Malaria, TB)
- `-c, --code <code>` - Filter by project code

#### Get Project Details
```bash
npm run db:cli -- project:get -i 1
```

**Options:**
- `-i, --id <id>` - Project ID (required)

### Facility Management

#### Create a Facility
```bash
npm run db:cli -- facility:create -n "Central District Hospital" -t "hospital" -d 1
```

**Options:**
- `-n, --name <name>` - Facility name (required)
- `-t, --type <type>` - Facility type: hospital, health_center (required)
- `-d, --district <district>` - District ID (required)

#### List Facilities
```bash
# List all facilities
npm run db:cli -- facility:list

# Filter by type
npm run db:cli -- facility:list -t hospital

# Filter by district
npm run db:cli -- facility:list -d 1

# Search by name
npm run db:cli -- facility:list -n "Central"
```

**Options:**
- `-t, --type <type>` - Filter by facility type (hospital, health_center)
- `-d, --district <district>` - Filter by district ID
- `-n, --name <name>` - Filter by facility name

### Planning Data Management

#### Create Planning Data
```bash
npm run db:cli -- planning:create \
  -a 1 \
  -f 1 \
  -r 1 \
  -p 1 \
  --frequency "12" \
  --unit-cost "75000" \
  --q1 1 \
  --q2 1 \
  --q3 1 \
  --q4 1 \
  --comment "Medical doctor salary for the year"
```

**Options:**
- `-a, --activity <activity>` - Activity ID (required)
- `-f, --facility <facility>` - Facility ID (required)
- `-r, --reporting-period <period>` - Reporting Period ID (required)
- `-p, --project <project>` - Project ID (required)
- `--frequency <frequency>` - Frequency (required)
- `--unit-cost <cost>` - Unit cost (required)
- `--q1 <q1>` - Q1 count (default: 0)
- `--q2 <q2>` - Q2 count (default: 0)
- `--q3 <q3>` - Q3 count (default: 0)
- `--q4 <q4>` - Q4 count (default: 0)
- `--comment <comment>` - Comment (optional)

#### List Planning Data
```bash
# List all planning data for a facility and reporting period
npm run db:cli -- planning:list -f 1 -r 1

# Filter by project
npm run db:cli -- planning:list -f 1 -r 1 -p 1
```

**Options:**
- `-f, --facility <facility>` - Facility ID (required)
- `-r, --reporting-period <period>` - Reporting Period ID (required)
- `-p, --project <project>` - Project ID (optional)

### Execution Data Management

#### Create Execution Data
```bash
npm run db:cli -- execution:create \
  -f 1 \
  -p 1 \
  -a 1 \
  --q1 "225000" \
  --q2 "225000" \
  --q3 "225000" \
  --q4 "225000" \
  --comment "Medical doctor salary payments" \
  --created-by "admin@example.com"
```

**Options:**
- `-f, --facility <facility>` - Facility ID (required)
- `-p, --project <project>` - Project ID (required)
- `-a, --activity <activity>` - Activity ID (optional)
- `-r, --reporting-period <period>` - Reporting Period ID (optional)
- `--q1 <q1>` - Q1 amount (default: 0.00)
- `--q2 <q2>` - Q2 amount (default: 0.00)
- `--q3 <q3>` - Q3 amount (default: 0.00)
- `--q4 <q4>` - Q4 amount (default: 0.00)
- `--comment <comment>` - Comment (optional)
- `--created-by <user>` - Created by user (optional)

#### List Execution Data
```bash
# List all execution data for a facility and reporting period
npm run db:cli -- execution:list -f 1 -r 1

# Filter by project
npm run db:cli -- execution:list -f 1 -r 1 -p 1
```

**Options:**
- `-f, --facility <facility>` - Facility ID (required)
- `-r, --reporting-period <period>` - Reporting Period ID (required)
- `-p, --project <project>` - Project ID (optional)

### Reporting

#### Planning vs Execution Report
```bash
npm run db:cli -- report:planning-vs-execution -f 1 -r 1 -p 1
```

**Options:**
- `-f, --facility <facility>` - Facility ID (required)
- `-r, --reporting-period <period>` - Reporting Period ID (required)
- `-p, --project <project>` - Project ID (required)

#### Facility Performance Summary
```bash
npm run db:cli -- report:facility-performance -f 1 -r 1
```

**Options:**
- `-f, --facility <facility>` - Facility ID (required)
- `-r, --reporting-period <period>` - Reporting Period ID (required)

### Bulk Operations

#### Bulk Create Planning Data
```bash
npm run db:cli -- bulk:create-planning \
  -f "1,2,3" \
  -r 1 \
  -p 1 \
  -c "HR" \
  -a '[{"name":"Medical Doctor Salary","frequency":12,"unitCost":75000},{"name":"Nurse Salary","frequency":12,"unitCost":45000}]'
```

**Options:**
- `-f, --facilities <facilities>` - Comma-separated facility IDs (required)
- `-r, --reporting-period <period>` - Reporting Period ID (required)
- `-p, --project <project>` - Project ID (required)
- `-c, --category <category>` - Category code (required)
- `-a, --activities <activities>` - JSON string of activities array (required)

### Validation

#### Validate Data Integrity
```bash
npm run db:cli -- validate:integrity
```

#### Clean Up Data
```bash
npm run db:cli -- validate:cleanup
```

### Utilities

#### Get Database Statistics
```bash
npm run db:cli -- stats
```

#### Run Examples
```bash
# Run comprehensive examples
npm run db:cli -- examples:run

# Run project examples only
npm run db:cli -- examples:projects
```

#### Show Usage Examples
```bash
npm run db:cli -- help:examples
```

## 🎯 Common Use Cases

### 1. Setting Up a New Project

```bash
# 1. Create project
npm run db:cli -- project:create -n "Malaria Control Program" -c "MAL2024" -t "Malaria"

# 2. Create facility
npm run db:cli -- facility:create -n "Malaria Treatment Center" -t "health_center" -d 1

# 3. Create planning data
npm run db:cli -- planning:create -a 1 -f 1 -r 1 -p 1 --frequency "12" --unit-cost "50000" --q1 1 --q2 1 --q3 1 --q4 1

# 4. Generate report
npm run db:cli -- report:planning-vs-execution -f 1 -r 1 -p 1
```

### 2. Bulk Data Import

```bash
# Import planning data for multiple facilities
npm run db:cli -- bulk:create-planning \
  -f "1,2,3,4,5" \
  -r 1 \
  -p 1 \
  -c "HR" \
  -a '[{"name":"Medical Doctor Salary","frequency":12,"unitCost":75000},{"name":"Nurse Salary","frequency":12,"unitCost":45000}]'
```

### 3. Data Validation and Cleanup

```bash
# Check data integrity
npm run db:cli -- validate:integrity

# Clean up orphaned and duplicate data
npm run db:cli -- validate:cleanup
```

### 4. Generate Reports

```bash
# Planning vs execution comparison
npm run db:cli -- report:planning-vs-execution -f 1 -r 1 -p 1

# Facility performance summary
npm run db:cli -- report:facility-performance -f 1 -r 1

# Database statistics
npm run db:cli -- stats
```

## 🔧 Advanced Usage

### Using Environment Variables

You can set environment variables for database connection:

```bash
# Set database URL
export DATABASE_URL="postgresql://user:password@localhost:5432/database"

# Run CLI commands
npm run db:cli -- stats
```

### Scripting with CLI

Create shell scripts to automate common tasks:

```bash
#!/bin/bash
# setup-project.sh

PROJECT_NAME="HIV Program 2024"
PROJECT_CODE="HIV2024"
FACILITY_NAME="Central Hospital"

# Create project
npm run db:cli -- project:create -n "$PROJECT_NAME" -c "$PROJECT_CODE" -t "HIV"

# Create facility
npm run db:cli -- facility:create -n "$FACILITY_NAME" -t "hospital" -d 1

# Generate report
npm run db:cli -- stats
```

### Integration with CI/CD

```yaml
# .github/workflows/db-validation.yml
name: Database Validation

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run db:cli -- validate:integrity
      - run: npm run db:cli -- stats
```

## 🚨 Error Handling

The CLI provides clear error messages and exit codes:

- **Exit code 0**: Success
- **Exit code 1**: Error occurred

### Common Errors and Solutions

1. **Database Connection Error**
   ```
   ❌ Error: connect ECONNREFUSED
   ```
   **Solution**: Check your DATABASE_URL environment variable

2. **Missing Required Options**
   ```
   ❌ error: required option '-n, --name <name>' not specified
   ```
   **Solution**: Provide all required options

3. **Invalid Data Type**
   ```
   ❌ Failed to create project: invalid input syntax for type integer
   ```
   **Solution**: Ensure numeric values are valid integers

## 📊 Output Formats

### Success Output
```
✅ Project created successfully: { id: 1, name: "HIV Program", ... }
```

### Error Output
```
❌ Failed to create project: Project with code HIV2024 already exists
```

### List Output
```
📋 Projects:
  - HIV Prevention Program 2024 (HIV2024) - HIV - ACTIVE
  - Malaria Control Program (MAL2024) - Malaria - ACTIVE

Total: 2 projects
```

## 🔍 Debugging

### Enable Verbose Logging
```bash
# Set debug environment variable
export DEBUG=db-cli:*

# Run command with verbose output
npm run db:cli -- stats
```

### Check Database Connection
```bash
# Test database connection
npm run db:cli -- stats

# If successful, you'll see database statistics
# If failed, check your DATABASE_URL
```

## 📚 Additional Resources

- [Database Operations Scripts README](./README.md)
- [Usage Examples](./usage-examples.ts)
- [CRUD Operations](./crud-operations.ts)
- [Advanced Operations](./advanced-operations.ts)

## 🤝 Contributing

When adding new CLI commands:

1. Follow the existing naming conventions
2. Add proper error handling
3. Include help text for all options
4. Add examples to this guide
5. Test with various input scenarios 