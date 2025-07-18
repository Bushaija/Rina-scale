"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"

interface Program {
  id: string
  name: string
}

interface Facility {
  id: string
  name: string
  type: string
  program?: string
}

interface FacilityType {
  id: string
  label: string
}

interface NewExecutionDialogProps {
  programs: Program[]
  facilities: Facility[]
  facilityTypes: FacilityType[]
  onCreateExecution: (facilityId: string, facilityType: string, program?: string) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  isAvailableForExecution?: (facilityName: string, program: string) => boolean
}

export function NewExecutionDialog({
  programs,
  facilities,
  facilityTypes,
  onCreateExecution,
  open,
  onOpenChange,
  isAvailableForExecution,
}: NewExecutionDialogProps) {
  const [selectedProgram, setSelectedProgram] = useState("")
  const [selectedFacilityId, setSelectedFacilityId] = useState("")
  const [selectedType, setSelectedType] = useState("")

  // Filter facilities based on selected type and program availability
  const filteredFacilities = facilities.filter((f) => {
    if (!selectedType) return true; // no type selected yet
    if (f.type !== selectedType) return false;

    // If a program is selected and we have availability checker, use it
    if (selectedProgram && isAvailableForExecution) {
      return isAvailableForExecution(f.name, selectedProgram);
    }

    // Fallback to original logic for backward compatibility
    if (selectedProgram) {
      return f.program ? f.program === selectedProgram : true;
    }
    return true;
  });

  const selectedFacilityName = useMemo(() => {
    const facility = facilities.find(f => f.id === selectedFacilityId)
    return facility?.name ?? ""
  }, [selectedFacilityId, facilities])

  const handleCreate = () => {
    if (!selectedFacilityId || !selectedType || !selectedProgram) return
    onCreateExecution(selectedFacilityId, selectedType, selectedProgram)
    setSelectedProgram("")
    setSelectedFacilityId("")
    setSelectedType("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-24 w-32 border-[1.5px] hover:border-primary/80 hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-2 rounded-sm"
        >
          <div className="w-12 h-12 bg-primary/10 rounded-sm flex items-center justify-center">
            <Plus className="h-8 w-8 text-primary" />
          </div>
          <span className="text-xs font-medium">New Execution</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-md">Create New Execution</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-6 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="program" className="text-sm font-medium">Program</Label>
            <Select
              value={selectedProgram}
              onValueChange={(value: string) => {
                setSelectedProgram(value)
                setSelectedFacilityId("") // Reset facility when program changes
              }}
            >
              <SelectTrigger id="program" className="w-full">
                <SelectValue placeholder="Select program" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="type" className="text-sm font-medium">Health Facility Type</Label>
            <Select
              value={selectedType}
              onValueChange={(value: string) => {
                setSelectedType(value)
                setSelectedFacilityId("") // Reset facility when type changes
              }}
            >
              <SelectTrigger id="type" className="w-full">
                <SelectValue placeholder="Select facility type" />
              </SelectTrigger>
              <SelectContent>
                {facilityTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="facility" className="text-sm font-medium">Health Facility Name</Label>
            <Select
              value={selectedFacilityId}
              onValueChange={setSelectedFacilityId}
              disabled={!selectedType}
            >
              <SelectTrigger id="facility" className="w-full">
                <SelectValue className="text-sm" placeholder="Select health facility" />
              </SelectTrigger>
              <SelectContent>
                {filteredFacilities.map((facility) => (
                  <SelectItem key={facility.id} value={facility.id}>
                    {facility.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleCreate}
            disabled={!selectedFacilityId || !selectedType || !selectedProgram}
            className="w-full mt-4 text-xs font-medium"
          >
            Create Execution
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 