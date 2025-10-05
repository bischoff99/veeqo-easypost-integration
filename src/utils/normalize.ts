// Data normalization utility
export function normalizeAddress(address: any): any {
  // Placeholder: Normalize address format
  return {
    street1: address.street1 || address.address1 || '',
    street2: address.street2 || address.address2 || '',
    city: address.city || '',
    state: address.state || '',
    zip: address.zip || address.postal_code || '',
    country: address.country || 'US'
  };
}
