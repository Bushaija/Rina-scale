// Debug script for Planning Configuration API
// Run this with: node debug-planning-api.js

const testRequest = {
  "projectId": 1,
  "facilityType": "hospital",
  "categories": [
    {
      "code": "HR",
      "name": "Human Resources",
      "displayOrder": 1,
      "activities": [
        {
          "name": "Activity test",
          "displayOrder": 10,
          "templateId": 1,
          "isTotalRow": false,
          "config": {
            "propertyName*": null
          },
          "defaultFrequency": 1,
          "defaultUnitCost": 1
        }
      ]
    }
  ],
  "changeReason": ""
};

async function testAPI() {
  try {
    console.log('Testing Planning Configuration API...');
    console.log('Request:', JSON.stringify(testRequest, null, 2));
    
    const response = await fetch('http://localhost:3000/api/planning-config/activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRequest)
    });
    
    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response Body:', responseText);
    
    if (response.ok) {
      console.log('✅ API call successful!');
    } else {
      console.log('❌ API call failed');
    }
    
  } catch (error) {
    console.error('❌ Error calling API:', error.message);
  }
}

// Test without templateId first
async function testWithoutTemplate() {
  try {
    console.log('\n--- Testing without templateId ---');
    
    const requestWithoutTemplate = {
      ...testRequest,
      categories: testRequest.categories.map(cat => ({
        ...cat,
        activities: cat.activities.map(act => ({
          ...act,
          templateId: undefined // Remove templateId
        }))
      }))
    };
    
    const response = await fetch('http://localhost:3000/api/planning-config/activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestWithoutTemplate)
    });
    
    console.log('Response Status:', response.status);
    const responseText = await response.text();
    console.log('Response Body:', responseText);
    
  } catch (error) {
    console.error('❌ Error calling API without template:', error.message);
  }
}

// Test with different projectId
async function testWithDifferentProject() {
  try {
    console.log('\n--- Testing with projectId 999 ---');
    
    const requestWithDifferentProject = {
      ...testRequest,
      projectId: 999
    };
    
    const response = await fetch('http://localhost:3000/api/planning-config/activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestWithDifferentProject)
    });
    
    console.log('Response Status:', response.status);
    const responseText = await response.text();
    console.log('Response Body:', responseText);
    
  } catch (error) {
    console.error('❌ Error calling API with different project:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🔍 Starting Planning Configuration API Debug Tests\n');
  
  await testAPI();
  await testWithoutTemplate();
  await testWithDifferentProject();
  
  console.log('\n📋 Debug Summary:');
  console.log('1. If the first test fails with 500, it might be a database issue');
  console.log('2. If the second test works, the issue is with templateId=1 not existing');
  console.log('3. If the third test works, the issue is with projectId=1 not existing');
  console.log('4. If all tests fail, there might be a database connection or table issue');
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.log('⚠️  Fetch not available. Please run this with Node.js 18+ or install node-fetch');
  console.log('   npm install node-fetch');
  process.exit(1);
}

runAllTests().catch(console.error); 