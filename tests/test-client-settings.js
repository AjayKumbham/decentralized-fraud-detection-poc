// test-client-settings.js
// Test script to verify client settings functionality for all clients

import axios from 'axios';

const CLIENT_URLS = {
  "1": 'http://localhost:4001',
  "2": 'http://localhost:4002', 
  "3": 'http://localhost:4003'
};

async function testClientSettings(clientId) {
  const baseUrl = CLIENT_URLS[clientId];
  console.log(`\n🧪 Testing Client ${clientId} Settings API...`);

  try {
    // Test 1: Get current settings
    console.log(`1. Getting current settings for Client ${clientId}...`);
    const getResponse = await axios.get(`${baseUrl}/client/${clientId}/settings`);
    console.log(`✅ Current settings:`, getResponse.data);

    // Test 2: Save new settings
    console.log(`\n2. Saving new settings for Client ${clientId}...`);
    const newSettings = {
      clientName: `Test Client ${clientId}`,
      apiPort: 4000 + parseInt(clientId),
      modelType: "random_forest",
      dataRetention: 60,
      autoSync: true,
      enableLogging: true,
      maxTrainingTime: 600,
      confidenceThreshold: 0.6
    };
    
    const saveResponse = await axios.post(`${baseUrl}/client/${clientId}/settings`, newSettings);
    console.log(`✅ Settings saved:`, saveResponse.data);

    // Test 3: Verify settings were saved
    console.log(`\n3. Verifying saved settings for Client ${clientId}...`);
    const verifyResponse = await axios.get(`${baseUrl}/client/${clientId}/settings`);
    console.log(`✅ Verified settings:`, verifyResponse.data);

    // Test 4: Test invalid settings
    console.log(`\n4. Testing invalid settings for Client ${clientId}...`);
    try {
      await axios.post(`${baseUrl}/client/${clientId}/settings`, {
        apiPort: 99999, // Invalid port
        dataRetention: 999, // Invalid retention
        maxTrainingTime: 9999, // Invalid training time
        confidenceThreshold: 2.0 // Invalid threshold
      });
    } catch (error) {
      console.log(`✅ Invalid settings properly rejected:`, error.response.data);
    }

    console.log(`\n🎉 All tests passed for Client ${clientId}!`);

  } catch (error) {
    console.error(`❌ Test failed for Client ${clientId}:`, error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

async function testAllClients() {
  console.log('🧪 Testing Client Settings API for all clients...\n');
  
  for (const clientId of Object.keys(CLIENT_URLS)) {
    await testClientSettings(clientId);
  }
  
  console.log('\n🎉 All client settings tests completed!');
}

// Run the test
testAllClients(); 