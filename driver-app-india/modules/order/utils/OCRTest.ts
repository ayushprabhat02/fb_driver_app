/**
 * OCR Test Script
 * This script tests the OCR functionality with sample images
 */

import {OCRService} from '../modules/order/services/OCRService';

// Mock test data
const mockOCRText = `
ORDER DETAILS
Order ID: ORD-12345
Customer: John Smith
Quantity: 2500 Litres
Fuel Type: Diesel
Delivery Location: Mumbai Central Depot
Date: 2024-01-15

FUEL DELIVERY ORDER
Order Number: #67890
Customer Name: ABC Transport Ltd.
Volume: 1500 L
Product: High Speed Diesel (HSD)
Site Address: Pune Industrial Area

DELIVERY CHALLAN
Ref: 54321
Qty: 3000 LTR
Fuel: Petrol
Location: Bangalore Station
`;

// Mock OCR result for testing
const mockOCRResult = {
  text: mockOCRText,
  blocks: [
    {
      text: 'ORDER DETAILS',
      lines: [{ text: 'ORDER DETAILS', elements: [{ text: 'ORDER', recognizedLanguages: [] }, { text: 'DETAILS', recognizedLanguages: [] }], recognizedLanguages: [] }],
      recognizedLanguages: []
    },
    {
      text: 'Order ID: ORD-12345',
      lines: [{ text: 'Order ID: ORD-12345', elements: [{ text: 'Order', recognizedLanguages: [] }, { text: 'ID:', recognizedLanguages: [] }, { text: 'ORD-12345', recognizedLanguages: [] }], recognizedLanguages: [] }],
      recognizedLanguages: []
    }
  ]
};

/**
 * Test OCR Service functionality
 */
export async function testOCRService() {
  console.log('🧪 Testing OCR Service...\n');
  
  try {
    // Test 1: Extract Order ID
    console.log('Test 1: Extract Order ID');
    const orderId = OCRService.extractOrderId(mockOCRText);
    console.log(`Result: ${orderId}`);
    console.log(`Expected: ORD-12345`);
    console.log(`✅ ${orderId === 'ORD-12345' ? 'PASSED' : 'FAILED'}\n`);
    
    // Test 2: Extract Quantity
    console.log('Test 2: Extract Quantity');
    const quantity = OCRService.extractQuantity(mockOCRText);
    console.log(`Result: ${quantity}`);
    console.log(`Expected: 2500`);
    console.log(`✅ ${quantity === '2500' ? 'PASSED' : 'FAILED'}\n`);
    
    // Test 3: Extract Fuel Type
    console.log('Test 3: Extract Fuel Type');
    const fuelType = OCRService.extractFuelType(mockOCRText.toUpperCase());
    console.log(`Result: ${fuelType}`);
    console.log(`Expected: Diesel`);
    console.log(`✅ ${fuelType === 'Diesel' ? 'PASSED' : 'FAILED'}\n`);
    
    // Test 4: Extract Location
    console.log('Test 4: Extract Location');
    const location = OCRService.extractLocation(mockOCRText);
    console.log(`Result: ${location}`);
    console.log(`Expected: Mumbai Central Depot`);
    console.log(`✅ ${location === 'Mumbai Central Depot' ? 'PASSED' : 'FAILED'}\n`);
    
    // Test 5: Extract Customer Name
    console.log('Test 5: Extract Customer Name');
    const customerName = OCRService.extractCustomerName(mockOCRText);
    console.log(`Result: ${customerName}`);
    console.log(`Expected: John Smith`);
    console.log(`✅ ${customerName === 'John Smith' ? 'PASSED' : 'FAILED'}\n`);
    
    // Test 6: Full OCR Processing
    console.log('Test 6: Full OCR Processing');
    const extractedData = OCRService.extractOrderData(mockOCRResult);
    console.log('Extracted Data:', JSON.stringify(extractedData, null, 2));
    console.log(`Confidence: ${extractedData.confidence}%`);
    console.log(`✅ ${extractedData.confidence > 70 ? 'HIGH CONFIDENCE' : 'LOW CONFIDENCE'}\n`);
    
    console.log('🎉 OCR Service Tests Completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

/**
 * Test with different sample texts
 */
export function testVariousFormats() {
  console.log('\n📋 Testing Various OCR Formats...\n');
  
  const testCases = [
    {
      name: 'Simple Order',
      text: 'Order #98765\n500 L Diesel\nCustomer: Ram Kumar',
      expected: {
        orderId: 'ORD-98765',
        quantity: '500',
        fuelType: 'Diesel',
        customerName: 'Ram Kumar'
      }
    },
    {
      name: 'Complex Order',
      text: 'PURCHASE ORDER\nRef: PO-2024-001\nFuel: HIGH SPEED DIESEL\nQuantity: 3500 Litres\nDelivery: Chennai Port\nCustomer: XYZ Logistics Pvt Ltd',
      expected: {
        orderId: 'ORD-2024-001',
        quantity: '3500',
        fuelType: 'Diesel',
        location: 'Chennai Port',
        customerName: 'XYZ Logistics Pvt Ltd'
      }
    },
    {
      name: 'Minimal Order',
      text: 'ORD-55555\n1000L\nPETROL',
      expected: {
        orderId: 'ORD-55555',
        quantity: '1000',
        fuelType: 'Petrol'
      }
    }
  ];
  
  testCases.forEach((testCase, index) => {
    console.log(`Test Case ${index + 1}: ${testCase.name}`);
    console.log(`Text: "${testCase.text}"`);
    
    const extractedData = OCRService.extractOrderData({
      text: testCase.text,
      blocks: [{ text: testCase.text, lines: [], recognizedLanguages: [] }]
    });
    
    console.log('Extracted:', JSON.stringify(extractedData, null, 2));
    console.log('Expected:', JSON.stringify(testCase.expected, null, 2));
    
    const passed = Object.keys(testCase.expected).every(key => 
      extractedData[key as keyof typeof extractedData] === testCase.expected[key as keyof typeof testCase.expected]
    );
    
    console.log(`✅ ${passed ? 'PASSED' : 'FAILED'}\n`);
  });
}

/**
 * Run all tests
 */
export function runAllTests() {
  console.log('🔬 Starting OCR Service Test Suite...\n');
  
  testOCRService();
  setTimeout(() => testVariousFormats(), 1000);
}

// Export for use in other files
export default {
  testOCRService,
  testVariousFormats,
  runAllTests
};