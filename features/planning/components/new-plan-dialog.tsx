"use client"

import { useState } from "react"
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

interface NewPlanDialogProps {
  programs: Program[]
  facilities: Facility[]
  facilityTypes: FacilityType[]
  onCreatePlan: (facilityName: string, facilityType: string, program?: string) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  isAvailableForPlanning?: (facilityName: string, program: string) => boolean
}

export function NewPlanDialog({
  programs,
  facilities,
  facilityTypes,
  onCreatePlan,
  open,
  onOpenChange,
  isAvailableForPlanning,
}: NewPlanDialogProps) {
  const [selectedProgram, setSelectedProgram] = useState("")
  const [selectedFacility, setSelectedFacility] = useState("")
  const [selectedType, setSelectedType] = useState("")

  // Filter facilities based on selected type and program availability
  const filteredFacilities = facilities.filter((f) => {
    if (!selectedType) return true; // no type selected yet
    if (f.type !== selectedType) return false;

    // If a program is selected and we have availability checker, use it
    if (selectedProgram && isAvailableForPlanning) {
      return isAvailableForPlanning(f.name, selectedProgram);
    }

    // Fallback to original logic for backward compatibility
    if (selectedProgram) {
      return f.program ? f.program === selectedProgram : true;
    }
    return true;
  });

  const handleCreate = () => {
    if (!selectedFacility || !selectedType || !selectedProgram) return
    onCreatePlan(selectedFacility, selectedType, selectedProgram)
    setSelectedFacility("")
    setSelectedType("")
    setSelectedProgram("")
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
          <span className="text-xs font-medium">New Plan</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-md">Create New Plan</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-6 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="type" className="text-sm font-medium">Program</Label>
            <Select
              value={selectedProgram}
              onValueChange={(value: string) => {
                setSelectedProgram(value)
                setSelectedFacility("")
              }}
            >
              <SelectTrigger id="type" className="w-full">
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
                setSelectedFacility("")
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
              value={selectedFacility}
              onValueChange={setSelectedFacility}
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
            disabled={!selectedFacility || !selectedType}
            className="w-full mt-4 text-xs font-medium"
          >
            Create Plan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 