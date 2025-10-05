/**
 * OCR Test Images
 * Sample images for testing OCR functionality
 */

export const OCRTestImages = {
  // Sample order documents as base64 encoded images
  orderDocument1: `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=`,
  
  orderDocument2: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`,
  
  // Sample text representations of order documents
  sampleOrders: [
    {
      name: "Standard Fuel Order",
      text: `ORDER CONFIRMATION
Order ID: FUEL-2024-001
Customer: ABC Transport Ltd.
Quantity: 2500 Litres
Fuel Type: High Speed Diesel (HSD)
Delivery Location: Mumbai Central Depot
Order Date: 2024-01-15
Status: Confirmed`,
      expected: {
        orderId: "FUEL-2024-001",
        quantity: "2500",
        fuelType: "Diesel",
        customerName: "ABC Transport Ltd.",
        location: "Mumbai Central Depot"
      }
    },
    {
      name: "Petrol Delivery",
      text: `DELIVERY CHALLAN
Ref: ORD-54321
Quantity: 1500 LTR
Product: Motor Spirit (Petrol)
Customer: XYZ Logistics
Delivery Point: Pune Station
Driver: Ramesh Kumar`,
      expected: {
        orderId: "ORD-54321",
        quantity: "1500",
        fuelType: "Petrol",
        customerName: "XYZ Logistics",
        location: "Pune Station"
      }
    },
    {
      name: "Bulk Diesel Order",
      text: `FUEL SUPPLY ORDER
Order Number: BULK-789
Volume: 5000 Litres
Fuel: Diesel
Customer Name: National Carriers
Site Address: Chennai Port Area
Delivery Date: 15-01-2024`,
      expected: {
        orderId: "BULK-789",
        quantity: "5000",
        fuelType: "Diesel",
        customerName: "National Carriers",
        location: "Chennai Port Area"
      }
    }
  ],
  
  // Poor quality text samples for testing error handling
  poorQualityOrders: [
    {
      name: "Blurry Text",
      text: `0RDER 12345
QTY: 2000 L
FUE1: D1ESE1
CUST: TRANSP0RT`,
      expected: {
        orderId: "ORD-12345",
        quantity: "2000",
        fuelType: "Diesel"
      }
    },
    {
      name: "Partial Text",
      text: `Order #98765
...missing...
Quantity: 1800
...damaged...
Location: Bangalore`,
      expected: {
        orderId: "ORD-98765",
        quantity: "1800",
        location: "Bangalore"
      }
    }
  ]
};

/**
 * Get test data for OCR validation
 */
export function getTestData(type: 'good' | 'poor' = 'good') {
  if (type === 'poor') {
    return OCRTestImages.poorQualityOrders;
  }
  return OCRTestImages.sampleOrders;
}

/**
 * Create a mock OCR result from text
 */
export function createMockOCRResult(text: string) {
  return {
    text: text,
    blocks: text.split('\n').map(line => ({
      text: line,
      lines: [{
        text: line,
        elements: line.split(' ').map(word => ({
          text: word,
          recognizedLanguages: ['en']
        })),
        recognizedLanguages: ['en']
      }],
      recognizedLanguages: ['en']
    }))
  };
}

/**
 * Simulate OCR processing with confidence scores
 */
export function simulateOCRProcessing(text: string, quality: 'high' | 'medium' | 'low' = 'high') {
  const baseConfidence = quality === 'high' ? 95 : quality === 'medium' ? 75 : 55;
  const confidence = Math.max(50, baseConfidence + Math.random() * 20 - 10);
  
  return {
    text: text,
    confidence: Math.round(confidence),
    quality: quality,
    processingTime: Math.random() * 2000 + 500 // 500-2500ms
  };
}