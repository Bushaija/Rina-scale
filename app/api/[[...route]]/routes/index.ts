import createRouter from "../lib/create-app";
// import { BASE_PATH } from "../lib/constants";
import type { AppOpenAPI } from "../lib/types";

import index from "./index.route";
import auth from "./auth/auth.index";
import reports from "./reports/reports.index";
import projects from "./projects/projects.index";
import provinces from "./provinces/provinces.index";
import districts from "./districts/districts.index";
import facilities from "./facilities/facilities.index";
import masterData from "./master-data/master-data.index";
import executionData from "./execution-data/execution-data.index";
import reportingPeriods from "./reporting-periods/reporting-periods.index";
import categories from "./categories/categories.index";
import subCategories from "./sub-categories/sub-categories.index";
import activities from "./activities/activities.index";
import executionReporting from "./execution-reporting/execution-reporting.index";
import analytics from "./analytics/analytics.index";
import utilities from "./utilities/utilities.index";
import frontend from "./frontend/frontend.index";
import statements from "./statements/statements.index";
import planningActivities from "./planning-activities/planning-activities.index";
import planningData from "./planning-data/planning-data.index";
import plannedFacilities from "./planned-facilities/planned-facilities.index";

export function registerRoutes(app: AppOpenAPI) {
    return app
        .route('/', index)
        .route('/', provinces)
        .route('/', districts)
        .route('/', facilities)
        .route('/', auth)

        // execution data
        .route('/', activities)
        .route('/', executionData)
        .route('/', masterData)
        .route('/', projects)
        .route('/', reportingPeriods)
        .route('/', categories)
        .route('/', subCategories)
        .route('/', executionReporting)
        .route('/', analytics)
        .route('/', utilities)
        .route('/', frontend)
        .route('/', statements)

        // planning data    
        .route('/', planningActivities)
        .route('/', planningData)
        .route('/', plannedFacilities)
        .route('/', reports);
};


export const router = registerRoutes(
    createRouter()
);

export type router = typeof router;