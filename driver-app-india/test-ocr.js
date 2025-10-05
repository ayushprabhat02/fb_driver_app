/**
 * OCR Demo Script
 * Quick test to verify OCR functionality is working
 */

const {OCRService} = require('./modules/order/services/OCRService.ts');

// Sample test text
const sampleTexts = [
  'Order ID: ORD-12345\nQuantity: 2500 Litres\nFuel: Diesel\nCustomer: John Smith',
  'DELIVERY ORDER\nRef: #67890\nVolume: 1500 L\nProduct: High Speed Diesel\nLocation: Mumbai Depot',
  'FUEL ORDER\nOrder No: 54321\nQty: 3000 LTR\nFuel Type: Petrol\nSite: Bangalore Station'
];

console.log('🔍 OCR Service Demo\n');

// Test each sample
sampleTexts.forEach((text, index) => {
  console.log(`Sample ${index + 1}:`);
  console.log(`Text: "${text}"`);
  
  try {
    const result = OCRService.extractOrderData({
      text: text,
      blocks: [{ text: text, lines: [], recognizedLanguages: [] }]
    });
    
    console.log('Extracted Data:');
    console.log(`  Order ID: ${result.orderId || 'Not found'}`);
    console.log(`  Quantity: ${result.quantity || 'Not found'}`);
    console.log(`  Fuel Type: ${result.fuelType || 'Not found'}`);
    console.log(`  Customer: ${result.customerName || 'Not found'}`);
    console.log(`  Location: ${result.location || 'Not found'}`);
    console.log(`  Confidence: ${result.confidence}%`);
    console.log('✅ Processing successful\n');
    
  } catch (error) {
    console.error('❌ Processing failed:', error);
    console.log('');
  }
});

console.log('🎯 Demo completed!');