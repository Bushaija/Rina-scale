import { ActivityCategoryType } from "../types";

// Categories and their activities for Malaria program
export const MALARIA_ACTIVITIES: ActivityCategoryType = {
  "Epidemiology": [
    {
      typeOfActivity: "Participants at DHs staff",
      activity: "Data Manager, Planning and M&E officer, CHWs Supervisor, DG or Clinical Director"
    },
    {
      typeOfActivity: "Provide Perdiem to Health Centers staff",
      activity: "Data Manager or CEHO Supervisor and Head of Health Center"
    },
    {
      typeOfActivity: "Provide Mineral water to participants",
      activity: "Refreshments"
    },
    {
      typeOfActivity: "Transport fees for remote distance based HCs staff",
      activity: "Follow the District Council Decision/Hospital Health Committee Meeting resolution on Transport tariffs per District"
    },
    {
      typeOfActivity: "Bank Charges",
      activity: "Financial Services"
    }
  ],
  "Program Management": [
    {
      typeOfActivity: "Running costs",
      activity: "Mission fees while for report submission"
    }
  ],
  "Human Resources": [
    // {
    //   typeOfActivity: "Supervisor Salary",
    //   activity: "Supervision fees for Malaria Supervisor"
    // },
    {
      typeOfActivity: "DH CHWs supervisors A0",
      activity: "Staff Salary"
    },
    {
      typeOfActivity: "DH Lab technicians",
      activity: "Staff Salary"
    },
    {
      typeOfActivity: "DH Nurses A1",
      activity: "Staff Salary"
    },
    {
      typeOfActivity: "CHW supervisor, lab techs, 2 Nurses",
      activity: "Staff Salary"
    }
  ]
};
