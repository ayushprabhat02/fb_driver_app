import TextRecognition from '@react-native-ml-kit/text-recognition';

export interface OCRResult {
  text: string;
  blocks: Array<{
    text: string;
    lines: Array<{
      text: string;
      elements: Array<{
        text: string;
        confidence: number;
        boundingBox: {
          top: number;
          left: number;
          width: number;
          height: number;
        };
      }>;
      boundingBox: {
        top: number;
        left: number;
        width: number;
        height: number;
      };
    }>;
    boundingBox: {
      top: number;
      left: number;
      width: number;
      height: number;
    };
  }>;
}

export interface ExtractedOrderData {
  orderId?: string;
  quantity?: string;
  customerName?: string;
  location?: string;
  fuelType?: string;
  confidence: number;
}

class OCRService {
  /**
   * Process image and extract text with high accuracy
   */
  async processImage(imageUri: string): Promise<{
    text: string;
    result: OCRResult;
    extractedData: ExtractedOrderData;
  }> {
    try {
      // Process image using OCR
      const result = await TextRecognition.recognize(imageUri);
      
      // Convert to our OCRResult format
      const ocrResult: OCRResult = {
        text: result.text,
        blocks: result.blocks.map(block => ({
          text: block.text,
          lines: block.lines.map(line => ({
            text: line.text,
            elements: line.elements.map(element => ({
              text: element.text,
              confidence: 80, // Default confidence
              boundingBox: element.frame ? {
                top: element.frame.top,
                left: element.frame.left,
                width: element.frame.width,
                height: element.frame.height
              } : { top: 0, left: 0, width: 0, height: 0 }
            })),
            boundingBox: line.frame ? {
              top: line.frame.top,
              left: line.frame.left,
              width: line.frame.width,
              height: line.frame.height
            } : { top: 0, left: 0, width: 0, height: 0 }
          })),
          boundingBox: block.frame ? {
            top: block.frame.top,
            left: block.frame.left,
            width: block.frame.width,
            height: block.frame.height
          } : { top: 0, left: 0, width: 0, height: 0 }
        }))
      };
      
      // Extract structured data with high accuracy
      const extractedData = this.extractOrderData(ocrResult);
      
      return {
        text: result.text,
        result: ocrResult,
        extractedData,
      };
    } catch (error) {
      console.error('OCR Processing Error:', error);
      throw new Error('Failed to process image. Please try again.');
    }
  }

  /**
   * Extract order-related information from OCR result with high accuracy
   */
  private extractOrderData(result: OCRResult): ExtractedOrderData {
    try {
      const text = result.text;
      const upperText = text.toUpperCase();
      
      // Validate OCR result
      if (!text || text.trim().length === 0) {
        throw new Error('Empty OCR result');
      }
      
      const extractedData: ExtractedOrderData = {
        confidence: 0,
      };

      // Extract Order ID with multiple patterns
      extractedData.orderId = this.extractOrderId(text);
      
      // Extract Quantity with multiple patterns
      extractedData.quantity = this.extractQuantity(text);
      
      // Extract Fuel Type
      extractedData.fuelType = this.extractFuelType(upperText);
      
      // Extract Location
      extractedData.location = this.extractLocation(text);
      
      // Extract Customer Name
      extractedData.customerName = this.extractCustomerName(text);
      
      // Calculate overall confidence based on extracted fields
      extractedData.confidence = this.calculateConfidence(extractedData);
      
      return extractedData;
    } catch (error) {
      console.error('OCR data extraction failed:', error);
      return {
        orderId: undefined,
        quantity: undefined,
        fuelType: undefined,
        location: undefined,
        customerName: undefined,
        confidence: 0
      };
    }
  }

  /**
   * Extract Order ID with high accuracy using multiple patterns
   */
  private extractOrderId(text: string): string | undefined {
    const patterns = [
      // Pattern: ORD-12345, ORDER-12345, ORDER NO: 12345
      /(?:ORD|ORDER|ORDER\s*(?:NO|NUMBER|ID)?)[-#:\s]*(\d{4,})/i,
      // Pattern: Order ID: 12345, Order Number: 12345
      /ORDER\s*(?:ID|NUMBER)\s*[:#-]\s*(\d{4,})/i,
      // Pattern: #12345, Order #12345
      /(?:ORDER\s*)?#(\d{4,})/i,
      // Pattern: Reference: 12345, Ref: 12345
      /(?:REFERENCE|REF)[:#-]\s*(\d{4,})/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return `ORD-${match[1]}`;
      }
    }

    // Try to find any 4+ digit number that might be an order ID
    const numberMatch = text.match(/\b(\d{4,})\b/);
    if (numberMatch) {
      // Check if this number appears near order-related keywords
      const orderKeywords = ['order', 'purchase', 'delivery', 'shipment'];
      const textAroundNumber = text.substring(
        Math.max(0, text.indexOf(numberMatch[1]) - 50),
        Math.min(text.length, text.indexOf(numberMatch[1]) + numberMatch[1].length + 50)
      ).toLowerCase();
      
      if (orderKeywords.some(keyword => textAroundNumber.includes(keyword))) {
        return `ORD-${numberMatch[1]}`;
      }
    }

    return undefined;
  }

  /**
   * Extract Quantity with high accuracy using multiple patterns
   */
  private extractQuantity(text: string): string | undefined {
    const patterns = [
      // Pattern: 1000 L, 1000L, 1000 Litres, 1000 Liters
      /(\d+(?:\.\d+)?)\s*(?:L|LITRES?|LITERS?)\b/i,
      // Pattern: Quantity: 1000, Qty: 1000, Qty-1000
      /(?:QUANTITY|QTY|QNTY|VOLUME)[:#-]\s*(\d+(?:\.\d+)?)/i,
      // Pattern: 1000.00, 1000 (with context)
      /(?:QUANTITY|QTY|VOLUME|AMOUNT)\s*[:#-]\s*(\d+(?:\.\d{1,2})?)/i,
      // Pattern: Fuel quantity, Diesel quantity
      /(?:FUEL|DIESEL|PETROL)\s*(?:QUANTITY|QTY)[:#-]\s*(\d+(?:\.\d+)?)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }

    // Look for numbers that appear with quantity-related context
    const numberMatches = text.match(/\b(\d+(?:\.\d+)?)\b/g);
    if (numberMatches) {
      const quantityKeywords = ['quantity', 'qty', 'litre', 'liter', 'volume', 'amount'];
      
      for (const number of numberMatches) {
        const numValue = parseFloat(number);
        // Filter reasonable quantity ranges (10-50000 litres)
        if (numValue >= 10 && numValue <= 50000) {
          const textAroundNumber = text.substring(
            Math.max(0, text.indexOf(number) - 30),
            Math.min(text.length, text.indexOf(number) + number.length + 30)
          ).toLowerCase();
          
          if (quantityKeywords.some(keyword => textAroundNumber.includes(keyword))) {
            return number;
          }
        }
      }
    }

    return undefined;
  }

  /**
   * Extract Fuel Type with high accuracy
   */
  private extractFuelType(text: string): string | undefined {
    const fuelTypes = [
      { name: 'Diesel', keywords: ['DIESEL', 'HSD', 'HIGH SPEED DIESEL'] },
      { name: 'Petrol', keywords: ['PETROL', 'GASOLINE', 'MS', 'MOTOR SPIRIT'] },
      { name: 'CNG', keywords: ['CNG', 'COMPRESSED NATURAL GAS'] },
      { name: 'LPG', keywords: ['LPG', 'LIQUEFIED PETROLEUM GAS'] },
      { name: 'Kerosene', keywords: ['KEROSENE', 'SKO', 'SUPERIOR KEROSENE OIL'] },
    ];

    for (const fuel of fuelTypes) {
      for (const keyword of fuel.keywords) {
        if (text.includes(keyword)) {
          return fuel.name;
        }
      }
    }

    return undefined;
  }

  /**
   * Extract Location with high accuracy
   */
  private extractLocation(text: string): string | undefined {
    const locationKeywords = [
      'LOCATION', 'ADDRESS', 'PLACE', 'SITE', 'DESTINATION', 'DELIVERY LOCATION',
      'DELIVERY ADDRESS', 'DELIVERY PLACE', 'DELIVERY POINT', 'DROP LOCATION'
    ];

    const lines = text.split('\n');
    
    // Look for location keywords and extract the next meaningful line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (locationKeywords.some(keyword => line.toUpperCase().includes(keyword))) {
        // Look for the next non-empty meaningful line
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j].trim();
          if (nextLine && 
              nextLine.length > 3 && 
              !nextLine.match(/^\d+$/) && // Not just numbers
              !nextLine.match(/^[A-Z]{1,3}$/) // Not just short abbreviations
          ) {
            return nextLine;
          }
        }
      }
    }

    // Alternative: Look for common location patterns (cities, addresses)
    const locationPatterns = [
      /(?:LOCATION|ADDRESS)[:#-]\s*([A-Za-z\s,\d]+)/i,
      /(?:DELIVERY|DROP)\s*(?:LOCATION|ADDRESS)[:#-]\s*([A-Za-z\s,\d]+)/i,
    ];

    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Extract Customer Name with high accuracy
   */
  private extractCustomerName(text: string): string | undefined {
    const namePatterns = [
      // Pattern: Customer: John Doe, Customer Name: John Doe
      /(?:CUSTOMER|CLIENT|BUYER)\s*(?:NAME)?[:#-]\s*([A-Z][A-Za-z\s]+(?:[A-Z][A-Za-z\s]+)*)/i,
      // Pattern: Name: John Doe, Party Name: John Doe
      /(?:PARTY\s*)?NAME[:#-]\s*([A-Z][A-Za-z\s]+(?:[A-Z][A-Za-z\s]+)*)/i,
      // Pattern: M/s John Doe & Co, M/s ABC Corporation
      /M\/S[:#-]\s*([A-Z][A-Za-z\s&]+)/i,
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match) {
        const name = match[1].trim();
        // Filter out common false positives
        if (name.length > 2 && !name.match(/^\d+$/) && !name.match(/^(THE|AND|OR|OF)$/i)) {
          return name;
        }
      }
    }

    // Alternative: Look for capitalized words that might be names
    const capitalizedWords = text.match(/\b[A-Z][a-z]+\b/g);
    if (capitalizedWords && capitalizedWords.length >= 2) {
      const customerKeywords = ['customer', 'client', 'party', 'buyer'];
      
      for (let i = 0; i < capitalizedWords.length - 1; i++) {
        const textBefore = text.substring(
          Math.max(0, text.indexOf(capitalizedWords[i]) - 50),
          text.indexOf(capitalizedWords[i])
        ).toLowerCase();
        
        if (customerKeywords.some(keyword => textBefore.includes(keyword))) {
          return `${capitalizedWords[i]} ${capitalizedWords[i + 1]}`.trim();
        }
      }
    }

    return undefined;
  }

  /**
   * Calculate confidence score based on extracted data
   */
  private calculateConfidence(data: ExtractedOrderData): number {
    let confidence = 0;
    let fieldsFound = 0;
    
    if (data.orderId) {
      fieldsFound++;
      // Higher confidence if order ID follows standard format
      if (data.orderId.match(/^ORD-\d{4,}$/)) {
        confidence += 30;
      } else {
        confidence += 20;
      }
    }
    
    if (data.quantity) {
      fieldsFound++;
      const qty = parseFloat(data.quantity);
      if (qty >= 10 && qty <= 50000) {
        confidence += 25; // Reasonable quantity range
      } else {
        confidence += 15;
      }
    }
    
    if (data.fuelType) {
      fieldsFound++;
      confidence += 15;
    }
    
    if (data.customerName) {
      fieldsFound++;
      if (data.customerName.length > 3 && data.customerName.includes(' ')) {
        confidence += 20; // Looks like a full name
      } else {
        confidence += 10;
      }
    }
    
    if (data.location) {
      fieldsFound++;
      if (data.location.length > 5) {
        confidence += 15; // Reasonable location length
      } else {
        confidence += 10;
      }
    }
    
    // Bonus for multiple fields found
    if (fieldsFound >= 3) {
      confidence += 10;
    }
    
    return Math.min(confidence, 100); // Cap at 100%
  }

  /**
   * Validate extracted OCR data
   */
  private validateExtractedData(data: ExtractedOrderData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validate Order ID
    if (!data.orderId || data.orderId.length < 3) {
      errors.push('Invalid or missing order ID');
    }
    
    // Validate Quantity
    if (!data.quantity || isNaN(Number(data.quantity)) || Number(data.quantity) <= 0) {
      errors.push('Invalid or missing quantity');
    }
    
    // Validate Fuel Type
    if (!data.fuelType || !['DIESEL', 'PETROL', 'CNG', 'LPG'].includes(data.fuelType.toUpperCase())) {
      errors.push('Invalid or missing fuel type');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate if the image is suitable for OCR processing
   */
  validateImageForOCR(imageUri: string): Promise<boolean> {
    // This could be enhanced with image quality checks
    return Promise.resolve(true);
  }
}

export default new OCRService();