// import configureOpenAPI from "./lib/configure-open-api";
// import createApp from "./lib/create-app";
// import index from "./routes/index.route";
// import provinces from "./routes/provinces/provinces.index";
// import districts from "./routes/districts/districts.index";
// import facilities from "./routes/facilities/facilities.index";
// import plans from "./routes/plans/plans.index";
// import users from "./routes/users/users.index";
// import auth from "./routes/auth/auth.index";
// import executes from "./routes/executes/index";

// import reports from "./routes/executes/reports/reports.index";
// import masterData from "./routes/executes/master-data/master-data.index";
// import projects from "./routes/executes/projects/projects.index";
// import reportingPeriods from "./routes/executes/reporting-periods/reporting-periods.index";
// import executionData from "./routes/executes/execution-data/execution-data.index";

// const app = createApp();

// configureOpenAPI(app);

// const routes = [
//   reports,
//   executes,
//   auth,
//   index,
//   provinces,
//   districts,
//   facilities,
//   plans,
//   masterData,
//   projects,
//   reportingPeriods,
//   executionData,
//   users,
// ] as const;

// routes.forEach((route) => {
//   app.route("/api", route);
// });

// export type AppType = typeof routes[number];

// export default app;

import createApp from "./lib/create-app";
import { registerRoutes } from "./routes";
import configureOpenAPI from "./lib/configure-open-api";

const app = registerRoutes(createApp());
configureOpenAPI(app);

export default app;