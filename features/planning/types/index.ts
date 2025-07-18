import { ActivityCategoryType } from "../constants/types";
import { Activity as HIVActivity } from "../schema/hiv/plan-form-schema";
import { Activity as MalariaActivity } from "../schema/malaria/plan-form-schema";

// Union type to support both HIV and Malaria activities
export type Activity = HIVActivity | MalariaActivity;

export type PlanStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export interface PlanMetadata {
  facilityName?: string;
  facilityType?: string;
  district?: string;
  province?: string;
  period?: string;
  program?: string;
  submittedBy?: string;
  createdBy?: string;
  status?: PlanStatus;
}

export interface PlanActivitiesData {
    activities: Activity[];
    activityCategories: ActivityCategoryType;
    categorizedActivities: Record<string, Activity[]>;
    categoryTotals: Record<string, { amountQ1: number; amountQ2: number; amountQ3: number; amountQ4: number; totalBudget: number }>;
    expandedCategories: Record<string, boolean>;
} 