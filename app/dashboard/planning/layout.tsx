import { Toaster } from "@/components/ui/sonner"

export default function PlanningLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {children}
      <Toaster />
    </div>
  )
}