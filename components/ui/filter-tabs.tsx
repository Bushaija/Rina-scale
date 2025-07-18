"use client"

import { ReactNode } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export interface FilterTab {
  value: string
  label: string
  content: ReactNode
}

interface FilterTabsProps {
  tabs: FilterTab[]
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  tabsListClassName?: string
  tabTriggerClassName?: string
  tabContentClassName?: string
}

  // Helper function to map project codes to tab values
  export const getProjectCodeForTab = (tabValue: string): string => {
    const mapping = {
      'hiv': 'HIV',
      'malaria': 'MAL', 
      'tb': 'TB'
    }
    return mapping[tabValue as keyof typeof mapping] || tabValue.toUpperCase()
  }

export function FilterTabs({
  tabs,
  defaultValue,
  value,
  onValueChange,
  className = "w-full",
  tabsListClassName,
  tabTriggerClassName,
  tabContentClassName = "mt-0"
}: FilterTabsProps) {
  
  return (
    <Tabs 
      defaultValue={defaultValue || tabs[0]?.value} 
      value={value} 
      onValueChange={onValueChange} 
      className={className}
    >
      {/* Excel-style tab list */}
      <TabsList className={cn(
        "h-auto w-full justify-start rounded-none bg-transparent p-0 border-b border-gray-200 w-[250px]",
        tabsListClassName
      )}>
        {tabs.map((tab) => (
          <TabsTrigger 
            key={tab.value} 
            value={tab.value} 
            className={cn(
              "relative border-b-2 rounded-none bg-transparent px-4 py-3 text-sm font-medium text-gray-500 shadow-none transition-all hover:bg-gray-50 hover:text-gray-900 focus-visible:ring-0 data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-none",
              tabTriggerClassName
            )}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Tab content */}
      {tabs.map((tab) => (
        <TabsContent 
          key={tab.value} 
          value={tab.value} 
          className={cn("ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", tabContentClassName)}
        >
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
} 