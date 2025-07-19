-- Migration: Planning Module Scalability Enhancement
-- This migration creates the new centralized planning system tables
-- and migrates existing data from the current hardcoded approach

-- Step 1: Create Activity Templates Table
CREATE TABLE IF NOT EXISTS activity_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_type VARCHAR(50) NOT NULL,
    tags TEXT[],
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    UNIQUE (name, category_type)
);

-- Create indexes for performance
CREATE INDEX idx_activity_templates_category ON activity_templates USING btree (category_type);
CREATE INDEX idx_activity_templates_active ON activity_templates USING btree (is_active);

-- Step 2: Create Planning Category Versions Table
CREATE TABLE IF NOT EXISTS planning_category_versions (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL,
    version INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    facility_type VARCHAR(20) NOT NULL,
    code VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    display_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_to TIMESTAMP,
    change_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE (category_id, version)
);

-- Create indexes for performance
CREATE INDEX idx_planning_cat_versions_active ON planning_category_versions USING btree (is_active);
CREATE INDEX idx_planning_cat_versions_project ON planning_category_versions USING btree (project_id, facility_type);

-- Step 3: Create Planning Activity Versions Table
CREATE TABLE IF NOT EXISTS planning_activity_versions (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER NOT NULL,
    version INTEGER NOT NULL,
    template_id INTEGER,
    category_version_id INTEGER NOT NULL,
    facility_type VARCHAR(20) NOT NULL,
    name VARCHAR(200) NOT NULL,
    display_order INTEGER NOT NULL,
    is_total_row BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_to TIMESTAMP,
    config JSONB,
    default_frequency NUMERIC(10,2),
    default_unit_cost NUMERIC(18,2),
    change_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY (template_id) REFERENCES activity_templates(id),
    FOREIGN KEY (category_version_id) REFERENCES planning_category_versions(id) ON DELETE CASCADE,
    UNIQUE (activity_id, version)
);

-- Create indexes for performance
CREATE INDEX idx_planning_act_versions_active ON planning_activity_versions USING btree (is_active);
CREATE INDEX idx_planning_act_versions_category ON planning_activity_versions USING btree (category_version_id);

-- Step 4: Create Planning Configuration Table
CREATE TABLE IF NOT EXISTS planning_configuration (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    facility_type VARCHAR(20) NOT NULL,
    config_key VARCHAR(100) NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (project_id, facility_type, config_key)
);

-- Create indexes for performance
CREATE INDEX idx_planning_config_active ON planning_configuration USING btree (is_active);
CREATE INDEX idx_planning_config_project ON planning_configuration USING btree (project_id, facility_type);

-- Step 5: Insert Common Activity Templates
-- These templates can be reused across different projects

INSERT INTO activity_templates (name, description, category_type, tags, metadata) VALUES
('Medical Doctor Salary', 'Template for medical doctor salary activities', 'HR', ARRAY['salary', 'medical', 'staff'], '{"suggestedFrequency": 12, "costRange": {"min": 50000, "max": 200000}}'),
('Nurse Salary', 'Template for nurse salary activities', 'HR', ARRAY['salary', 'nursing', 'staff'], '{"suggestedFrequency": 12, "costRange": {"min": 30000, "max": 80000}}'),
('Administrative Staff Salary', 'Template for administrative staff salary', 'HR', ARRAY['salary', 'admin', 'staff'], '{"suggestedFrequency": 12, "costRange": {"min": 25000, "max": 60000}}'),
('Transport Costs', 'Template for various transport-related activities', 'TRC', ARRAY['transport', 'travel', 'mission'], '{"suggestedFrequency": 4, "costRange": {"min": 100, "max": 10000}}'),
('Office Supplies', 'Template for office supplies and administrative costs', 'PA', ARRAY['supplies', 'office', 'admin'], '{"suggestedFrequency": 1, "costRange": {"min": 500, "max": 5000}}'),
('Equipment Maintenance', 'Template for equipment maintenance activities', 'HPE', ARRAY['maintenance', 'equipment', 'repair'], '{"suggestedFrequency": 2, "costRange": {"min": 1000, "max": 20000}}');

-- Step 6: Migrate Existing Planning Categories to Versioned System
-- Create version 1 of all existing categories

INSERT INTO planning_category_versions (
    category_id, 
    version, 
    project_id, 
    facility_type, 
    code, 
    name, 
    display_order,
    change_reason
)
SELECT 
    id as category_id,
    1 as version,
    project_id,
    facility_type,
    code,
    name,
    display_order,
    'Initial migration from legacy system'
FROM planning_categories
WHERE id IS NOT NULL;

-- Step 7: Migrate Existing Planning Activities to Versioned System
-- Create version 1 of all existing activities

INSERT INTO planning_activity_versions (
    activity_id,
    version,
    category_version_id,
    facility_type,
    name,
    display_order,
    is_total_row,
    change_reason
)
SELECT 
    pa.id as activity_id,
    1 as version,
    pcv.id as category_version_id,
    pa.facility_type,
    pa.name,
    pa.display_order,
    pa.is_total_row,
    'Initial migration from legacy system'
FROM planning_activities pa
INNER JOIN planning_categories pc ON pa.category_id = pc.id
INNER JOIN planning_category_versions pcv ON (
    pcv.category_id = pc.id 
    AND pcv.project_id = pc.project_id 
    AND pcv.facility_type = pa.facility_type
    AND pcv.version = 1
)
WHERE pa.id IS NOT NULL;

-- Step 8: Create Initial Configuration Entries
-- Set up basic configuration for existing projects

INSERT INTO planning_configuration (project_id, facility_type, config_key, config_value, description)
SELECT DISTINCT 
    p.id as project_id,
    'hospital' as facility_type,
    'activity_management' as config_key,
    '{"allowDynamicActivities": true, "requireApprovalForChanges": false, "maxActivitiesPerCategory": 50}' as config_value,
    'Basic activity management configuration for hospitals'
FROM projects p;

INSERT INTO planning_configuration (project_id, facility_type, config_key, config_value, description)
SELECT DISTINCT 
    p.id as project_id,
    'health_center' as facility_type,
    'activity_management' as config_key,
    '{"allowDynamicActivities": true, "requireApprovalForChanges": false, "maxActivitiesPerCategory": 50}' as config_value,
    'Basic activity management configuration for health centers'
FROM projects p;

-- Step 9: Create View for Easy Access to Active Configurations
-- This view simplifies querying the current active configuration

CREATE OR REPLACE VIEW v_current_planning_structure AS
SELECT 
    pcv.project_id,
    pcv.facility_type,
    pcv.id as category_version_id,
    pcv.code as category_code,
    pcv.name as category_name,
    pcv.display_order as category_order,
    pav.id as activity_version_id,
    pav.activity_id,
    pav.name as activity_name,
    pav.display_order as activity_order,
    pav.is_total_row,
    pav.default_frequency,
    pav.default_unit_cost,
    pav.config as activity_config,
    at.name as template_name,
    at.category_type as template_category
FROM planning_category_versions pcv
LEFT JOIN planning_activity_versions pav ON pcv.id = pav.category_version_id
LEFT JOIN activity_templates at ON pav.template_id = at.id
WHERE pcv.is_active = true 
  AND (pav.is_active = true OR pav.is_active IS NULL)
  AND pcv.valid_to IS NULL
  AND (pav.valid_to IS NULL OR pav.valid_to IS NULL)
ORDER BY pcv.project_id, pcv.facility_type, pcv.display_order, pav.display_order;

-- Step 10: Create Trigger for Automatic Timestamp Updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to relevant tables
CREATE TRIGGER update_activity_templates_updated_at BEFORE UPDATE ON activity_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_planning_configuration_updated_at BEFORE UPDATE ON planning_configuration 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 11: Insert Initial Metadata for Enhanced Tracking
COMMENT ON TABLE activity_templates IS 'Reusable activity templates that can be applied across projects';
COMMENT ON TABLE planning_category_versions IS 'Versioned planning categories with temporal validity';
COMMENT ON TABLE planning_activity_versions IS 'Versioned planning activities with template linking';
COMMENT ON TABLE planning_configuration IS 'Flexible configuration management for planning behavior';

-- Step 12: Data Validation Queries (for verification after migration)
-- These queries help verify the migration was successful

-- Verify category migration
/*
SELECT 
    'Categories' as table_name,
    COUNT(*) as original_count,
    (SELECT COUNT(*) FROM planning_category_versions WHERE version = 1) as migrated_count
FROM planning_categories;
*/

-- Verify activity migration
/*
SELECT 
    'Activities' as table_name,
    COUNT(*) as original_count,
    (SELECT COUNT(*) FROM planning_activity_versions WHERE version = 1) as migrated_count
FROM planning_activities;
*/

-- Verify project coverage
/*
SELECT 
    p.name as project_name,
    COUNT(DISTINCT pcv.facility_type) as facility_types_configured
FROM projects p
LEFT JOIN planning_category_versions pcv ON p.id = pcv.project_id
GROUP BY p.id, p.name
ORDER BY p.name;
*/ 