// NEW: Template and Activity management component
"use client"

import { useState } from "react";
import { useActivityTemplates, useCreateActivityTemplate, usePlanningActivities, useCategorizedActivities, useCreateActivity } from "@/features/planning-config/api/use-planning-activities";

export default function AdminManagementComponent() {
  // Template management state
  const { data: templates, isLoading: templatesLoading } = useActivityTemplates();
  const createTemplate = useCreateActivityTemplate();
  const createActivity = useCreateActivity();
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    categoryType: '',
    tags: [],
  });

  // Activity management state
  const [selectedProgram, setSelectedProgram] = useState<'HIV' | 'TB' | 'MAL'>('HIV');
  const [selectedFacilityType, setSelectedFacilityType] = useState<'hospital' | 'health_center'>('hospital');
  const [newActivity, setNewActivity] = useState({
    name: '',
    description: '',
    categoryCode: '',
    displayOrder: 1,
    isTotalRow: false,
    defaultFrequency: 0,
    defaultUnitCost: 0,
  });

  // Fetch activities for selected program/facility
  const { data: activityStructure, isLoading: activitiesLoading } = usePlanningActivities(
    selectedProgram, 
    selectedFacilityType
  );

  const handleCreateTemplate = async () => {
    try {
      await createTemplate.mutateAsync(newTemplate);
      setNewTemplate({ name: '', description: '', categoryType: '', tags: [] });
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  const handleCreateActivity = async () => {
    try {
      await createActivity.mutateAsync({
        projectCode: selectedProgram,
        facilityType: selectedFacilityType,
        activity: newActivity
      });
      
      // Reset form
      setNewActivity({
        name: '',
        description: '',
        categoryCode: '',
        displayOrder: 1,
        isTotalRow: false,
        defaultFrequency: 0,
        defaultUnitCost: 0,
      });
    } catch (error) {
      console.error('Failed to create activity:', error);
    }
  };

  if (templatesLoading || activitiesLoading) {
    return <div className="text-gray-600 text-sm p-4">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Admin Management</h1>
      
      {/* Activity Management Section */}
      <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Activity Management</h2>
        
        {/* Program and Facility Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Program</label>
            <select 
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              value={selectedProgram}
              onChange={e => setSelectedProgram(e.target.value as 'HIV' | 'TB' | 'MAL')}
            >
              <option value="HIV">HIV</option>
              <option value="TB">TB</option>
              <option value="MAL">Malaria</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Facility Type</label>
            <select 
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              value={selectedFacilityType}
              onChange={e => setSelectedFacilityType(e.target.value as 'hospital' | 'health_center')}
            >
              <option value="hospital">Hospital</option>
              <option value="health_center">Health Center</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select 
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              value={newActivity.categoryCode}
              onChange={e => setNewActivity(prev => ({ ...prev, categoryCode: e.target.value }))}
            >
              <option value="">Select Category</option>
              {activityStructure?.categories.map(category => (
                <option key={category.id} value={category.code}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Create New Activity Form */}
        <div className="bg-gray-50 rounded p-4 space-y-4">
          <h3 className="text-lg font-medium text-gray-700">Create New Activity</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Activity Name</label>
              <input 
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                placeholder="Enter activity name"
                value={newActivity.name}
                onChange={e => setNewActivity(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input 
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                placeholder="Enter description"
                value={newActivity.description}
                onChange={e => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
              <input 
                type="number"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                value={newActivity.displayOrder}
                onChange={e => setNewActivity(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 1 }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Frequency</label>
              <input 
                type="number"
                step="0.01"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                value={newActivity.defaultFrequency}
                onChange={e => setNewActivity(prev => ({ ...prev, defaultFrequency: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Unit Cost</label>
              <input 
                type="number"
                step="0.01"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                value={newActivity.defaultUnitCost}
                onChange={e => setNewActivity(prev => ({ ...prev, defaultUnitCost: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox"
                id="isTotalRow"
                checked={newActivity.isTotalRow}
                onChange={e => setNewActivity(prev => ({ ...prev, isTotalRow: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <label htmlFor="isTotalRow" className="text-sm font-medium text-gray-700">
                Is Total Row
              </label>
            </div>
          </div>
          
          <button 
            onClick={handleCreateActivity}
            disabled={!newActivity.name || !newActivity.categoryCode}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded disabled:opacity-50"
          >
            Create Activity
          </button>
        </div>

        {/* Current Activities Display */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-700 mb-4">
            Current Activities for {selectedProgram} - {selectedFacilityType}
          </h3>
          
          <div className="space-y-4">
            {activityStructure?.categories.map(category => (
              <div key={category.id} className="border border-gray-200 rounded p-4">
                <h4 className="font-semibold text-gray-800 mb-2">{category.name}</h4>
                <div className="space-y-2">
                  {activityStructure.activities
                    .filter(activity => activity.categoryVersionId === category.id)
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map(activity => (
                      <div key={activity.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div>
                          <span className="font-medium text-sm">{activity.name}</span>
                          {activity.isTotalRow && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Total Row
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          Order: {activity.displayOrder}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Template Management Section */}
      <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Template Management</h2>
        
        {/* Create New Template */}
        <div className="bg-gray-50 rounded p-4 space-y-4 mb-6">
          <h3 className="text-lg font-medium text-gray-700">Create New Template</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder="Template Name"
              value={newTemplate.name}
              onChange={e => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
            />
            <select 
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              value={newTemplate.categoryType}
              onChange={e => setNewTemplate(prev => ({ ...prev, categoryType: e.target.value }))}
            >
              <option value="">Select Category Type</option>
              <option value="HR">Human Resources</option>
              <option value="TRC">Transport & Communication</option>
              <option value="PA">Programme Activities</option>
              <option value="HPE">Health Promotion & Education</option>
            </select>
          </div>
          <textarea 
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="Description"
            value={newTemplate.description}
            onChange={e => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
          />
          <button 
            onClick={handleCreateTemplate}
            disabled={!newTemplate.name || !newTemplate.categoryType}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded disabled:opacity-50"
          >
            Create Template
          </button>
        </div>
        
        {/* Existing Templates */}
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-4">Existing Templates</h3>
          <div className="space-y-4">
            {templates?.data.map(template => (
              <div key={template.id} className="bg-gray-50 border border-gray-200 rounded p-4 shadow-sm">
                <h4 className="text-md font-semibold text-gray-800">{template.name}</h4>
                <p className="text-sm text-gray-600">{template.description}</p>
                <div className="mt-2 text-xs text-gray-500 space-x-4">
                  <span>Category: {template.categoryType}</span>
                  <span>Tags: {template.tags.join(', ')}</span>
                  <span>Status: {template.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
