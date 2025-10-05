import axios, { AxiosInstance } from 'axios';

// Initialize Veeqo API client
const VEEQO_API_BASE = 'https://api.veeqo.com';

const createVeeqoClient = (): AxiosInstance => {
  return axios.create({
    baseURL: VEEQO_API_BASE,
    headers: {
      'x-api-key': process.env.VEEQO_API_KEY || '',
      'Content-Type': 'application/json',
    },
  });
};

const veeqoClient = createVeeqoClient();

// Types
export interface VeeqoAddress {
  first_name?: string;
  last_name?: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state?: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface VeeqoOrder {
  id: number;
  number: string;
  customer: {
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
  };
  deliver_to: VeeqoAddress;
  allocations?: VeeqoAllocation[];
}

export interface VeeqoAllocation {
  id: number;
  line_items: Array<{
    sellable_id: number;
    quantity: number;
  }>;
}

export interface VeeqoQuoteRequest {
  collection_address_id?: number;
  delivery_address?: VeeqoAddress;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  value?: number;
}

export interface VeeqoQuote {
  id?: string;
  carrier: string;
  service: string;
  service_code?: string;
  carrier_id?: number;
  price: number;
  currency: string;
  delivery_estimate?: string;
  delivery_days?: number;
}

export interface VeeqoPurchaseLabelPayload {
  allocation_id: number;
  carrier_id: number;
  service_code: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

export interface VeeqoShipment {
  id: number;
  tracking_number?: string;
  label_url?: string;
  carrier: string;
  service: string;
}

/**
 * Get an order by ID from Veeqo
 * @param orderId Veeqo order ID
 * @returns Order details
 */
export async function getOrder(orderId: string): Promise<VeeqoOrder> {
  try {
    const response = await veeqoClient.get(`/orders/${orderId}`);
    return response.data;
  } catch (error: any) {
    console.error('Veeqo getOrder error:', error.response?.data || error.message);
    throw new Error(
      `Failed to get order: ${error.response?.data?.message || error.message || 'Unknown error'}`
    );
  }
}

/**
 * Get shipping quotes from Veeqo
 * @param allocationId Veeqo allocation ID (optional)
 * @param quoteParams Quote parameters (optional, used if allocationId not provided)
 * @returns Array of quotes
 */
export async function getQuotes(
  allocationId?: number,
  quoteParams?: VeeqoQuoteRequest
): Promise<VeeqoQuote[]> {
  try {
    let response;
    
    if (allocationId) {
      // Get quotes for a specific allocation
      response = await veeqoClient.get(`/allocations/${allocationId}/delivery_methods`);
    } else if (quoteParams) {
      // Get quotes with custom parameters
      response = await veeqoClient.post('/delivery_quotes', quoteParams);
    } else {
      throw new Error('Either allocationId or quoteParams must be provided');
    }

    // Normalize response to VeeqoQuote array
    const quotes = response.data.delivery_methods || response.data.quotes || response.data;
    
    return Array.isArray(quotes) ? quotes.map((q: any) => ({
      id: q.id,
      carrier: q.carrier_name || q.carrier,
      service: q.service_name || q.service,
      service_code: q.service_code || q.code,
      carrier_id: q.carrier_id,
      price: parseFloat(q.price || q.cost || '0'),
      currency: q.currency || 'GBP',
      delivery_estimate: q.delivery_estimate || q.estimated_delivery,
      delivery_days: q.delivery_days || q.estimated_days,
    })) : [];
  } catch (error: any) {
    console.error('Veeqo getQuotes error:', error.response?.data || error.message);
    throw new Error(
      `Failed to get quotes: ${error.response?.data?.message || error.message || 'Unknown error'}`
    );
  }
}

/**
 * Purchase a shipping label from Veeqo
 * @param payload Purchase label payload
 * @returns Shipment details with tracking and label
 */
export async function purchaseLabel(
  payload: VeeqoPurchaseLabelPayload
): Promise<VeeqoShipment> {
  try {
    const response = await veeqoClient.post(
      `/allocations/${payload.allocation_id}/shipments`,
      {
        carrier_id: payload.carrier_id,
        service_code: payload.service_code,
        weight: payload.weight,
        dimensions: payload.dimensions,
      }
    );

    const shipment = response.data;
    return {
      id: shipment.id,
      tracking_number: shipment.tracking_number || shipment.tracking_code,
      label_url: shipment.label_url || shipment.postage_label?.label_url,
      carrier: shipment.carrier_name || shipment.carrier,
      service: shipment.service_name || shipment.service,
    };
  } catch (error: any) {
    console.error('Veeqo purchaseLabel error:', error.response?.data || error.message);
    throw new Error(
      `Failed to purchase label: ${error.response?.data?.message || error.message || 'Unknown error'}`
    );
  }
}

/**
 * Update a Veeqo order/allocation with shipment information
 * @param orderId Veeqo order ID
 * @param allocationId Veeqo allocation ID
 * @param shipmentData Shipment data to update
 * @returns Updated allocation
 */
export async function updateShipment(
  orderId: string,
  allocationId: number,
  shipmentData: {
    tracking_number?: string;
    carrier?: string;
    service?: string;
    label_url?: string;
    note?: string;
  }
): Promise<void> {
  try {
    // Update allocation with tracking information
    await veeqoClient.patch(`/allocations/${allocationId}`, {
      tracking_number: shipmentData.tracking_number,
      carrier: shipmentData.carrier,
      service: shipmentData.service,
    });

    // Optionally add a note with label URL
    if (shipmentData.note) {
      await veeqoClient.post(`/orders/${orderId}/notes`, {
        note: shipmentData.note,
      });
    }
  } catch (error: any) {
    console.error('Veeqo updateShipment error:', error.response?.data || error.message);
    throw new Error(
      `Failed to update shipment: ${error.response?.data?.message || error.message || 'Unknown error'}`
    );
  }
}

/**
 * Mark an allocation as shipped
 * @param allocationId Veeqo allocation ID
 * @returns Success status
 */
export async function markAsShipped(allocationId: number): Promise<void> {
  try {
    await veeqoClient.post(`/allocations/${allocationId}/mark_as_shipped`);
  } catch (error: any) {
    console.error('Veeqo markAsShipped error:', error.response?.data || error.message);
    throw new Error(
      `Failed to mark as shipped: ${error.response?.data?.message || error.message || 'Unknown error'}`
    );
  }
}
