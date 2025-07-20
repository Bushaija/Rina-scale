'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider, SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';

// HIV imports
import { Activity as HIVActivity, Plan as HIVPlan } from '@/features/planning/schema/hiv/plan-form-schema';
import { usePlanForm as useHIVPlanForm } from '@/features/planning/hooks/hiv/use-plan-form';

// Malaria imports
import { Activity as MalariaActivity, Plan as MalariaPlan } from '@/features/planning/schema/malaria/plan-form-schema';
import { usePlanForm as useMalariaPlanForm } from '@/features/planning/hooks/malaria/use-plan-form';

// TB imports
import { Activity as TBActivity, Plan as TBPlan } from '@/features/planning/schema/tb/plan-form-schema';
import { usePlanForm as useTBPlanForm } from '@/features/planning/hooks/tb/use-plan-form';

import { submitPlan } from '@/features/planning/services/plan-api';
import { useAppToast } from '@/hooks/use-app-toast';
import { useAsync } from '@/hooks/use-async';

import {
  useTempSaveForPlanForm,
} from '@/features/planning/stores/plan-temp-save-store';
import {
  capturePlanState,
  restorePlanState,
  createPlanMetadata,
  formatSaveTime,
} from '@/features/planning/utils/plan-temp-save-utils';

import { PlanMetadataHeader } from './plan-metadata-header';
import { FormErrorSummary } from './form-error-summary';
import { PlanActivitiesTable } from './plan-activities-table';
import { PlanFormActions } from './plan-form-actions';
import { PlanMetadata } from '../types';

// Union types to support all programs
type Activity = HIVActivity | MalariaActivity | TBActivity;
type Plan = HIVPlan | MalariaPlan | TBPlan;

interface PlanFormProps {
  isHospital?: boolean;
  initialActivities?: Activity[];
  isEdit?: boolean;
  isReadOnly?: boolean;
  planId?: string;
  /**
   * Callback executed on successful submission.
   * The parent component is responsible for any navigation after submission.
   */
  onSubmitSuccess?: (plan: Plan) => void;
  metadata?: PlanMetadata;
}

/**
 * Renders a comprehensive form for creating and editing financial plans.
 * 
 * This component dynamically uses HIV, Malaria, or TB schemas based on the program
 * specified in the metadata. It uses `react-hook-form` with Zod schema validation.
 * 
 * @param {PlanFormProps} props - The props for the component.
 */
export function PlanForm({ 
  isHospital = false, 
  initialActivities,
  isEdit = false,
  isReadOnly = false,
  planId,
  onSubmitSuccess,
  metadata = {}
}: PlanFormProps) {
  const [isDirty, setIsDirty] = useState(false);
  const [isTempSaving, setIsTempSaving] = useState(false);
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);

  const { showErrorToast } = useAppToast();
  const { execute: executeSubmit, isLoading: isSubmitting } = useAsync(submitPlan);

  // Build metadata for temp save
  const planTempMetadata = useMemo(() =>
    createPlanMetadata({
      facilityName: metadata?.facilityName,
      facilityType: metadata?.facilityType,
      programName: metadata?.program,
    }),
  [metadata]);

  const {
    saveTemporary,
    restoreTemporary,
    hasSave,
    save: existingSave,
    lastSaved,
    removeTemporary,
  } = useTempSaveForPlanForm(planTempMetadata);

  // form-dependent hooks will be defined after form is available (below).

  // Determine which program to use based on metadata
  console.log("metadata :: ", metadata.program);
  const programLower = metadata.program?.toLowerCase();
  const isHIVProgram = programLower?.includes('hiv') || !metadata.program; // Default to HIV if no program specified
  const isMalariaProgram = programLower?.includes('malaria') || programLower === 'mal';
  const isTBProgram = programLower?.includes('tb') || programLower?.includes('tuberculosis');
  
  console.log("🐛 PlanForm Program Detection Details:", {
    originalProgram: metadata.program,
    programLower,
    includesTb: programLower?.includes('tb'),
    includesTuberculosis: programLower?.includes('tuberculosis'),
    finalIsTBProgram: isTBProgram
  });

  // Debug logging to help diagnose issues
  console.log('🐛 PlanForm Debug:', {
    programFromMetadata: metadata.program,
    isHIVProgram,
    isMalariaProgram,
    isTBProgram,
    initialActivitiesCount: initialActivities?.length || 0,
    isHospital,
    metadata
  });

  // Use the appropriate hook based on program
  const hivFormData = useHIVPlanForm({ 
    isHospital, 
    initialActivities: isHIVProgram ? initialActivities as HIVActivity[] : undefined 
  });
  
  const malariaFormData = useMalariaPlanForm({ 
    isHospital, 
    initialActivities: isMalariaProgram ? initialActivities as MalariaActivity[] : undefined 
  });

  const tbFormData = useTBPlanForm({
    isHospital,
    initialActivities: isTBProgram ? initialActivities as TBActivity[] : undefined
  });

  // Select the appropriate form data based on program
  const {
    form,
    activities,
    activityCategories,
    expandedCategories,
    toggleCategory,
    categorizedActivities,
    getActivityIndex,
    categoryTotals,
  } = isTBProgram ? tbFormData : (isMalariaProgram ? malariaFormData : hivFormData);

  const { handleSubmit, formState: { errors } } = form;

  console.log("form errors", errors);
  
  const onSubmit: SubmitHandler<Plan> = async (data) => {
    if (isReadOnly) return;

    // If parent supplied its own handler, use it and skip the legacy submitPlan
    if (onSubmitSuccess) {
      try {
        await onSubmitSuccess(data);
        // showSuccessToast("Plan saved successfully!");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        showErrorToast("Failed to save plan", errorMessage);
        console.error("💥 Error saving plan:", error);
      }
      return;
    }

    // Legacy POST /api/plan path (not used in current flow)
    try {
      const responseData = await executeSubmit(data as any, metadata, isHospital, isEdit);
      // showSuccessToast("Plan saved successfully!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      showErrorToast("Failed to save plan", errorMessage);
      console.error("💥 Error saving plan:", error);
    }
  };

  // ---------------- Temp Save & Dirty Tracking ----------------

  // Track dirty state when form values change
  useEffect(() => {
    const subscription = (form as any).watch(() => {
      setIsDirty(true);
    });
    return () => {
      if (subscription?.unsubscribe) subscription.unsubscribe();
    };
  }, [form]);

  // Show restore banner if draft exists
  useEffect(() => {
    if (hasSave) {
      setShowRestoreBanner(true);
    }
  }, [hasSave]);

  // Save draft handler
  const handleTempSave = useCallback(() => {
    if (!planTempMetadata) return;
    setIsTempSaving(true);
    try {
      const planData = capturePlanState(form as any);
      saveTemporary(planData as any);
      setIsDirty(false);
      toast.success('Draft saved');
    } catch (err) {
      toast.error('Failed to save draft');
    } finally {
      setIsTempSaving(false);
    }
  }, [planTempMetadata, form, saveTemporary]);

  // Restore draft handler
  const handleRestoreDraft = useCallback(() => {
    const saved = restoreTemporary();
    if (saved) {
      restorePlanState(saved as any, form as any);
      toast.success('Draft restored');
      setShowRestoreBanner(false);
      setIsDirty(false);
    }
  }, [restoreTemporary, form]);


  return (
    <FormProvider {...(form as any)}>
      {showRestoreBanner && existingSave && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-blue-900 font-medium">Draft Available</p>
              <p className="text-sm text-blue-700">Saved {formatSaveTime(existingSave.timestamps.lastSaved)}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="text-sm text-blue-700 hover:underline"
                onClick={handleRestoreDraft}
              >
                Restore
              </button>
              <button
                type="button"
                className="text-sm text-gray-600 hover:underline"
                onClick={() => {
                  removeTemporary();
                  setShowRestoreBanner(false);
                }}
              >
                Discard
              </button>
              <button
                type="button"
                className="text-sm hover:underline"
                onClick={() => setShowRestoreBanner(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        

        <div className="flex justify-between items-center bg-gray-100 border-1 border-gray-200 rounded-md p-2">
            <PlanMetadataHeader {...metadata} />
            <PlanFormActions 
              isSubmitting={isSubmitting}
              isEdit={isEdit}
              isReadOnly={isReadOnly}
              onTempSave={planTempMetadata ? handleTempSave : undefined}
              isTempSaving={isTempSaving}
              canTempSave={isDirty && !isTempSaving}
            />
        </div>
        
        <div className="px-4">
            <FormErrorSummary errors={errors} />
        </div>

        
        <PlanActivitiesTable
          form={form as any}
          activitiesData={{
            activities,
            activityCategories,
            categorizedActivities,
            categoryTotals,
            expandedCategories
          }}
          getActivityIndex={getActivityIndex}
          toggleCategory={toggleCategory}
          isReadOnly={isReadOnly}
          program={metadata.program}
        />
        
        <div className="flex justify-end text-sm text-gray-500 px-4">
            <span className="font-semibold">Note:</span> All fields are required. Budget totals must match annual allocations.
        </div>
        
      </form>
    </FormProvider>
  );
} 