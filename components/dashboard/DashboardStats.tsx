"use client"

import { Percent, Building } from "lucide-react"
import { StatCard } from "./StatCard"
import { StatCardSkeleton } from "@/components/skeletons"

import { getHealthCentersByHospital } from "@/features/on-boarding/utils/location-utils"
import { useListExecutedFacilities } from "@/features/api/frontend"
import { useGetFacilityById } from "@/features/facilities/api/use-get-facility"
import { authClient } from "@/lib/auth-client"


export interface DashboardStatsProps {
  executedCount?: number
  facilityId?: number
}

export function DashboardStats({ executedCount: executedProp, facilityId: facilityIdProp }: DashboardStatsProps) {
  const { data: session } = authClient.useSession()

  const facilityId = facilityIdProp ?? session?.user?.facilityId ?? 0
  const facilityQuery = useGetFacilityById(facilityId, { enabled: facilityId > 0 })
  const executedQuery = useListExecutedFacilities()
  const executedFacilities = executedQuery.data ?? []
  const executedCountCalculated = executedFacilities.some((f) => f.id === facilityId) ? 1 : 0

  // Enhanced debugging
  console.log("🔍 DashboardStats Debug:")
  console.log("  - executedQuery.isLoading:", executedQuery.isLoading)
  console.log("  - executedQuery.isError:", executedQuery.isError)
  console.log("  - executedQuery.error:", executedQuery.error)
  console.log("  - executedQuery.data:", executedQuery.data)
  console.log("  - executedFacilities:", executedFacilities)
  console.log("  - executedFacilities.length:", executedFacilities.length)
  console.log("  - facilityId:", facilityId)
  console.log("  - executedCountCalculated:", executedCountCalculated)

  const executedCount = executedProp ?? executedCountCalculated

  const healthCenters = getHealthCentersByHospital(facilityQuery.data?.name ?? "")
  const totalCount = healthCenters.length + (facilityQuery.data ? 1 : 0)

  const executionRate = totalCount > 0 ? (executedCount / totalCount) * 100 : 0

  if (facilityQuery.isLoading || executedQuery.isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    )
  }

  if (facilityQuery.isError || executedQuery.isError) {
    console.error("🚨 DashboardStats Error:")
    console.error("  - facilityQuery.error:", facilityQuery.error)
    console.error("  - executedQuery.error:", executedQuery.error)
    return (
      <div className="text-sm text-destructive-foreground">
        Failed to load dashboard statistics.
        {executedQuery.isError && (
          <div className="text-xs mt-1">
            Executed facilities error: {executedQuery.error?.message || 'Unknown error'}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <StatCard
        title="Facilities Executed"
        value={`${executedCount}/${totalCount}`}
        icon={<Building className="h-4 w-4 text-muted-foreground" />}
      />

      <StatCard
        title="Execution Rate"
        value={`${executionRate.toFixed(2)}%`}
        icon={<Percent className="h-4 w-4 text-muted-foreground" />}
      />
    </div>
  )
} 