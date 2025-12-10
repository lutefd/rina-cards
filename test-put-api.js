// Simple script to test the PUT endpoint for group purchases
// Run with: node test-put-api.js

const testUpdateGroupPurchase = async () => {
  const cegId = '8b6323fa-400b-4450-89b1-19f49b7e79e8'; // The ID from the error message
  
  try {
    const response = await fetch(`http://localhost:3000/api/group-purchases/${cegId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Update with the fields you want to change
        title: "Updated CEG Title",
        status: "open" // Make sure it's set to "open"
      }),
      credentials: 'include' // Important to include cookies for auth
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', data);
  } catch (error) {
    console.error('Error testing PUT endpoint:', error);
  }
};

testUpdateGroupPurchase();
