/**
 * Normalize shipping rates from different providers into a unified format
 */

import { getCarrierMapping, getServiceMapping } from '../config/mapping';

// Unified rate structure
export interface NormalizedRate {
  id: string;
  provider: 'easypost' | 'veeqo';
  carrier: string;
  carrier_normalized: string;
  service: string;
  service_normalized: string;
  price: number;
  currency: string;
  delivery_days: number | null;
  delivery_date: string | null;
  delivery_estimate: string | null;
  est_delivery_days: number | null;
  metadata: {
    shipmentId?: string;
    allocationId?: number;
    rateId?: string;
    carrierId?: number;
    serviceCode?: string;
    original: any;
  };
}

/**
 * Normalize a rate from any provider to unified format
 * @param rate Raw rate object from provider
 * @param provider Provider name
 * @param context Additional context (shipmentId, allocationId, etc.)
 * @returns Normalized rate
 */
export function normalizeRate(
  rate: any,
  provider: 'easypost' | 'veeqo',
  context?: { shipmentId?: string; allocationId?: number }
): NormalizedRate {
  if (provider === 'easypost') {
    return normalizeEasyPostRate(rate, context);
  } else if (provider === 'veeqo') {
    return normalizeVeeqoRate(rate, context);
  }
  throw new Error(`Unknown provider: ${provider}`);
}

/**
 * Normalize an EasyPost rate
 */
function normalizeEasyPostRate(
  rate: any,
  context?: { shipmentId?: string }
): NormalizedRate {
  const carrier = rate.carrier || 'Unknown';
  const service = rate.service || 'Unknown';

  return {
    id: rate.id,
    provider: 'easypost',
    carrier,
    carrier_normalized: getCarrierMapping(carrier) || carrier,
    service,
    service_normalized: getServiceMapping(carrier, service) || service,
    price: parseFloat(rate.rate || '0'),
    currency: rate.currency || 'USD',
    delivery_days: rate.delivery_days !== undefined ? rate.delivery_days : null,
    delivery_date: rate.delivery_date || null,
    delivery_estimate: rate.delivery_date || null,
    est_delivery_days: rate.est_delivery_days || rate.delivery_days || null,
    metadata: {
      shipmentId: context?.shipmentId,
      rateId: rate.id,
      original: rate,
    },
  };
}

/**
 * Normalize a Veeqo rate/quote
 */
function normalizeVeeqoRate(
  rate: any,
  context?: { allocationId?: number }
): NormalizedRate {
  const carrier = rate.carrier || rate.carrier_name || 'Unknown';
  const service = rate.service || rate.service_name || 'Unknown';
  const price = typeof rate.price === 'number' ? rate.price : parseFloat(rate.price || '0');

  return {
    id: rate.id || `veeqo_${rate.carrier_id}_${rate.service_code}`,
    provider: 'veeqo',
    carrier,
    carrier_normalized: getCarrierMapping(carrier) || carrier,
    service,
    service_normalized: getServiceMapping(carrier, service) || service,
    price,
    currency: rate.currency || 'GBP',
    delivery_days: rate.delivery_days || null,
    delivery_date: rate.delivery_estimate || null,
    delivery_estimate: rate.delivery_estimate || null,
    est_delivery_days: rate.delivery_days || null,
    metadata: {
      allocationId: context?.allocationId,
      carrierId: rate.carrier_id,
      serviceCode: rate.service_code || rate.code,
      original: rate,
    },
  };
}

/**
 * Normalize an address from any provider format
 * @param address Address object from any provider
 * @returns Normalized address
 */
export function normalizeAddress(address: any): any {
  if (!address) return null;

  return {
    name: address.name || `${address.first_name || ''} ${address.last_name || ''}`.trim() || undefined,
    company: address.company || undefined,
    street1: address.street1 || address.address1 || '',
    street2: address.street2 || address.address2 || undefined,
    city: address.city || '',
    state: address.state || address.province || undefined,
    zip: address.zip || address.postal_code || address.postcode || '',
    country: address.country || address.country_code || 'US',
    phone: address.phone || undefined,
    email: address.email || undefined,
  };
}

/**
 * Convert weight between units
 * @param weight Weight value
 * @param fromUnit Source unit (oz, lb, g, kg)
 * @param toUnit Target unit
 * @returns Converted weight
 */
export function convertWeight(
  weight: number,
  fromUnit: string,
  toUnit: string
): number {
  const ozToGrams = 28.3495;
  const lbToGrams = 453.592;

  // Convert to grams first
  let grams: number;
  switch (fromUnit.toLowerCase()) {
    case 'oz':
      grams = weight * ozToGrams;
      break;
    case 'lb':
    case 'lbs':
      grams = weight * lbToGrams;
      break;
    case 'g':
      grams = weight;
      break;
    case 'kg':
      grams = weight * 1000;
      break;
    default:
      grams = weight; // Assume grams if unknown
  }

  // Convert from grams to target unit
  switch (toUnit.toLowerCase()) {
    case 'oz':
      return grams / ozToGrams;
    case 'lb':
    case 'lbs':
      return grams / lbToGrams;
    case 'g':
      return grams;
    case 'kg':
      return grams / 1000;
    default:
      return grams;
  }
}

/**
 * Convert dimensions between units
 * @param value Dimension value
 * @param fromUnit Source unit (in, cm)
 * @param toUnit Target unit
 * @returns Converted dimension
 */
export function convertDimension(
  value: number,
  fromUnit: string,
  toUnit: string
): number {
  const inchToCm = 2.54;

  // Convert to cm first
  let cm: number;
  switch (fromUnit.toLowerCase()) {
    case 'in':
    case 'inch':
    case 'inches':
      cm = value * inchToCm;
      break;
    case 'cm':
      cm = value;
      break;
    default:
      cm = value; // Assume cm if unknown
  }

  // Convert from cm to target unit
  switch (toUnit.toLowerCase()) {
    case 'in':
    case 'inch':
    case 'inches':
      return cm / inchToCm;
    case 'cm':
      return cm;
    default:
      return cm;
  }
}
