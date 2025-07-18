import React from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export interface PlanFormActionsProps {
  isSubmitting: boolean;
  isEdit?: boolean;
  isReadOnly?: boolean;
  onTempSave?: () => void;
  isTempSaving?: boolean;
  canTempSave?: boolean;
}

export function PlanFormActions({
  isSubmitting,
  isEdit = false,
  isReadOnly = false,
  onTempSave,
  isTempSaving = false,
  canTempSave = true,
}: PlanFormActionsProps) {
  const router = useRouter();

  if (isReadOnly) {
    return (
      <div className="flex justify-end">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => router.push('/dashboard/planning')}
        >
          Back to List
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-end items-end">
      <div className="flex space-x-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => router.push('/dashboard/planning')}
          disabled={isSubmitting || isTempSaving}
        >
          Cancel Plan
        </Button>

        {onTempSave && (
          <Button
            type="button"
            variant="outline"
            onClick={onTempSave}
            disabled={!canTempSave || isTempSaving || isSubmitting}
            className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
          >
            {isTempSaving ? 'Saving Draft...' : 'Save Draft'}
          </Button>
        )}

        <Button 
          type="submit" 
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Update Plan' : 'Save Plan'}
        </Button>
      </div>
      
    </div>
  );
} 