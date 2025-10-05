/**
 * Carrier and service name mapping configuration
 * Maps provider-specific carrier and service names to standardized values
 */

// Carrier name mapping - maps various spellings/formats to standard names
const CARRIER_MAPPINGS: Record<string, string> = {
  // USPS variants
  'USPS': 'USPS',
  'usps': 'USPS',
  'United States Postal Service': 'USPS',
  'US Postal Service': 'USPS',
  
  // UPS variants
  'UPS': 'UPS',
  'ups': 'UPS',
  'United Parcel Service': 'UPS',
  
  // FedEx variants
  'FedEx': 'FedEx',
  'fedex': 'FedEx',
  'FEDEX': 'FedEx',
  'Federal Express': 'FedEx',
  
  // DHL variants
  'DHL': 'DHL',
  'dhl': 'DHL',
  'DHL Express': 'DHL',
  
  // Royal Mail (UK)
  'Royal Mail': 'Royal Mail',
  'RoyalMail': 'Royal Mail',
  'royal-mail': 'Royal Mail',
  
  // DPD (UK/Europe)
  'DPD': 'DPD',
  'dpd': 'DPD',
  'DPD UK': 'DPD',
  
  // Hermes/Evri (UK)
  'Hermes': 'Evri',
  'Evri': 'Evri',
  'hermes': 'Evri',
  
  // Canada Post
  'Canada Post': 'Canada Post',
  'CanadaPost': 'Canada Post',
  'canada-post': 'Canada Post',
};

// Service name mapping by carrier
// Format: 'CARRIER:SERVICE' -> 'Normalized Service Name'
const SERVICE_MAPPINGS: Record<string, string> = {
  // USPS Services
  'USPS:Priority': 'Priority Mail',
  'USPS:PriorityMailExpress': 'Priority Mail Express',
  'USPS:Express': 'Priority Mail Express',
  'USPS:FirstClassMail': 'First-Class Mail',
  'USPS:FirstClass': 'First-Class Mail',
  'USPS:ParcelSelect': 'Parcel Select',
  'USPS:Ground': 'Parcel Select Ground',
  'USPS:MediaMail': 'Media Mail',
  
  // UPS Services
  'UPS:Ground': 'UPS Ground',
  'UPS:3DaySelect': 'UPS 3 Day Select',
  'UPS:2ndDayAir': 'UPS 2nd Day Air',
  'UPS:NextDayAir': 'UPS Next Day Air',
  'UPS:NextDayAirSaver': 'UPS Next Day Air Saver',
  'UPS:Standard': 'UPS Standard',
  
  // FedEx Services
  'FedEx:Ground': 'FedEx Ground',
  'FedEx:HomeDelivery': 'FedEx Home Delivery',
  'FedEx:2Day': 'FedEx 2Day',
  'FedEx:Express': 'FedEx Express Saver',
  'FedEx:StandardOvernight': 'FedEx Standard Overnight',
  'FedEx:PriorityOvernight': 'FedEx Priority Overnight',
  'FedEx:FirstOvernight': 'FedEx First Overnight',
  
  // DHL Services
  'DHL:Express': 'DHL Express Worldwide',
  'DHL:ExpressEnvelope': 'DHL Express Envelope',
  'DHL:ExpressEasy': 'DHL Express Easy',
  
  // Royal Mail Services (UK)
  'Royal Mail:1stClass': 'Royal Mail 1st Class',
  'Royal Mail:2ndClass': 'Royal Mail 2nd Class',
  'Royal Mail:Tracked24': 'Royal Mail Tracked 24',
  'Royal Mail:Tracked48': 'Royal Mail Tracked 48',
  'Royal Mail:SpecialDelivery': 'Royal Mail Special Delivery',
  
  // DPD Services (UK/Europe)
  'DPD:NextDay': 'DPD Next Day',
  'DPD:TwoDay': 'DPD Two Day Service',
  'DPD:Classic': 'DPD Classic',
  'DPD:Express': 'DPD Express',
};

/**
 * Get normalized carrier name
 * @param carrier Raw carrier name
 * @returns Normalized carrier name or original if no mapping exists
 */
export function getCarrierMapping(carrier: string): string | null {
  if (!carrier) return null;
  return CARRIER_MAPPINGS[carrier] || null;
}

/**
 * Get normalized service name
 * @param carrier Carrier name
 * @param service Raw service name
 * @returns Normalized service name or original if no mapping exists
 */
export function getServiceMapping(carrier: string, service: string): string | null {
  if (!carrier || !service) return null;
  
  // Try exact match first
  const key = `${carrier}:${service}`;
  if (SERVICE_MAPPINGS[key]) {
    return SERVICE_MAPPINGS[key];
  }
  
  // Try case-insensitive match
  const lowerKey = `${carrier}:${service}`.toLowerCase();
  for (const [mappingKey, mappingValue] of Object.entries(SERVICE_MAPPINGS)) {
    if (mappingKey.toLowerCase() === lowerKey) {
      return mappingValue;
    }
  }
  
  return null;
}

/**
 * Add custom carrier mapping
 * @param from Source carrier name
 * @param to Target carrier name
 */
export function addCarrierMapping(from: string, to: string): void {
  CARRIER_MAPPINGS[from] = to;
}

/**
 * Add custom service mapping
 * @param carrier Carrier name
 * @param from Source service name
 * @param to Target service name
 */
export function addServiceMapping(carrier: string, from: string, to: string): void {
  const key = `${carrier}:${from}`;
  SERVICE_MAPPINGS[key] = to;
}
