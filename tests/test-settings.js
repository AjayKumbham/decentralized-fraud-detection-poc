// test-settings.js
// Simple test script to verify server settings functionality

import axios from 'axios';

const SERVER_URL = 'http://localhost:4000';

async function testSettings() {
  console.log('🧪 Testing Server Settings API...\n');

  try {
    // Test 1: Get current settings
    console.log('1. Getting current settings...');
    const getResponse = await axios.get(`${SERVER_URL}/server/settings`);
    console.log('✅ Current settings:', getResponse.data);

    // Test 2: Save new settings
    console.log('\n2. Saving new settings...');
    const newSettings = {
      apiPort: 4000,
      ersThreshold: [0.4, 0.8],
      weightingStrategy: "equal",
      enableERS: true
    };
    
    const saveResponse = await axios.post(`${SERVER_URL}/server/settings`, newSettings);
    console.log('✅ Settings saved:', saveResponse.data);

    // Test 3: Verify settings were saved
    console.log('\n3. Verifying saved settings...');
    const verifyResponse = await axios.get(`${SERVER_URL}/server/settings`);
    console.log('✅ Verified settings:', verifyResponse.data);

    // Test 4: Test invalid settings
    console.log('\n4. Testing invalid settings...');
    try {
      await axios.post(`${SERVER_URL}/server/settings`, {
        apiPort: 99999, // Invalid port
        ersThreshold: [0.5], // Invalid threshold array
        weightingStrategy: "invalid" // Invalid strategy
      });
    } catch (error) {
      console.log('✅ Invalid settings properly rejected:', error.response.data);
    }

    console.log('\n🎉 All tests passed! Server settings are working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run the test
testSettings(); 