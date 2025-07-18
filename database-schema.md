```sql

CREATE TABLE provinces (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE districts (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    province_id INTEGER NOT NULL REFERENCES provinces(id)
);

CREATE TABLE facilities (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    facility_type TEXT NOT NULL CHECK (facility_type IN ('hospital', 'health_center')),
    district_id INTEGER NOT NULL REFERENCES districts(id),
    UNIQUE(name, district_id)
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'guest')),
    facility_id INTEGER REFERENCES facilities(id), -- Can be NULL for non-facility-specific users
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE plan_activities (
    id SERIAL PRIMARY KEY,
    facility_id INTEGER NOT NULL REFERENCES facilities(id),
    fiscal_year TEXT NOT NULL,
    project TEXT NOT NULL DEFAULT 'HIV NSP BUDGET SUPPORT',
    plan_last_modified TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    activity_category TEXT NOT NULL,
    type_of_activity TEXT NOT NULL,
    activity_description TEXT,
    frequency NUMERIC(10, 2) NOT NULL,
    unit_cost DECIMAL(18, 2) NOT NULL,
    count_q1 INTEGER DEFAULT 0,
    count_q2 INTEGER DEFAULT 0,
    count_q3 INTEGER DEFAULT 0,
    count_q4 INTEGER DEFAULT 0,
    amount_q1 DECIMAL(18, 2) GENERATED ALWAYS AS (frequency * unit_cost * count_q1) STORED,
    amount_q2 DECIMAL(18, 2) GENERATED ALWAYS AS (frequency * unit_cost * count_q2) STORED,
    amount_q3 DECIMAL(18, 2) GENERATED ALWAYS AS (frequency * unit_cost * count_q3) STORED,
    amount_q4 DECIMAL(18, 2) GENERATED ALWAYS AS (frequency * unit_cost * count_q4) STORED,
    total_budget DECIMAL(18, 2) GENERATED ALWAYS AS ((frequency * unit_cost * count_q1) + (frequency * unit_cost * count_q2) + (frequency * unit_cost * count_q3) + (frequency * unit_cost * count_q4)) STORED,
    comment TEXT,
    -- A single facility can only have one plan entry per activity type per year
    UNIQUE(facility_id, fiscal_year, project, type_of_activity),

    -- Audit Trail
    created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    last_modified_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE execution_reports (
    id SERIAL PRIMARY KEY,
    facility_id INTEGER NOT NULL REFERENCES facilities(id),
    fiscal_year TEXT NOT NULL,
    reporting_period TEXT NOT NULL,
    project TEXT NOT NULL,
    report_last_modified TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    activity_category TEXT NOT NULL,
    type_of_activity TEXT NOT NULL,
    activity_description TEXT,
    q1_amount DECIMAL(18, 2),
    q2_amount DECIMAL(18, 2),
    q3_amount DECIMAL(18, 2),
    q4_amount DECIMAL(18, 2),
    cumulative_balance DECIMAL(18, 2),
    comments TEXT,
    -- A single facility can only have one entry per line item per reporting period
    UNIQUE(facility_id, fiscal_year, project, reporting_period, type_of_activity),

    -- Audit Trail
    created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    last_modified_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);


```