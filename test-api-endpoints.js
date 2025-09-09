// Test script to verify API endpoints are working correctly
const axios = require('axios');

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';

// Test data for form submission
const testSubmissionData = {
  form_uuid: 'test-form-uuid',
  submitter_name: 'Test User',
  submitter_email: 'test@example.com',
  status: 'submitted',
  user_uuid: 'test-user-uuid',
  country_uuid: 'test-country-uuid',
  province_uuid: 'test-province-uuid',
  area_uuid: 'test-area-uuid'
};

// Test data for form response
const testResponseData = {
  visite_harder_uuid: 'test-submission-uuid',
  form_item_uuid: 'test-form-item-uuid',
  text_value: 'Test response value',
  latitude: 40.7128,
  longitude: -74.0060,
  user_uuid: 'test-user-uuid',
  country_uuid: 'test-country-uuid',
  province_uuid: 'test-province-uuid',
  area_uuid: 'test-area-uuid'
};

async function testFormSubmissionEndpoint() {
  console.log('🔍 Testing Form Submission Endpoint (VisiteHarder)...');
  try {
    const response = await axios.post(`${API_BASE_URL}/visite-harder/create`, testSubmissionData);
    console.log('✅ Form Submission Test Successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Form Submission Test Failed:', error.response?.data || error.message);
    return null;
  }
}

async function testFormResponseEndpoint() {
  console.log('🔍 Testing Form Response Endpoint (VisiteData)...');
  try {
    const response = await axios.post(`${API_BASE_URL}/visite-data/create`, testResponseData);
    console.log('✅ Form Response Test Successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Form Response Test Failed:', error.response?.data || error.message);
    return null;
  }
}

async function testFormListEndpoint() {
  console.log('🔍 Testing Form List Endpoint...');
  try {
    const response = await axios.get(`${API_BASE_URL}/forms/all`);
    console.log('✅ Form List Test Successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Form List Test Failed:', error.response?.data || error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting API Endpoint Tests...');
  console.log('🌐 Testing against:', API_BASE_URL);
  console.log('==========================================');
  
  // Test form list first (read-only)
  await testFormListEndpoint();
  
  console.log('==========================================');
  
  // Test form submission
  const submissionResult = await testFormSubmissionEndpoint();
  
  console.log('==========================================');
  
  // Test form response (only if submission was successful)
  if (submissionResult && submissionResult.status === 'success') {
    testResponseData.visite_harder_uuid = submissionResult.data?.uuid || 'test-submission-uuid';
    await testFormResponseEndpoint();
  } else {
    await testFormResponseEndpoint();
  }
  
  console.log('==========================================');
  console.log('🎯 API Endpoint Tests Complete!');
}

// Run the tests
runTests().catch(console.error);
