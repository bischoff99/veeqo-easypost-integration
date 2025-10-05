import EasyPost from '@easypost/api';

// Initialize EasyPost client
const client = new EasyPost(process.env.EASYPOST_API_KEY || '');

// Types
export interface Address {
  name?: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface Parcel {
  length: number;
  width: number;
  height: number;
  weight: number;
}

export interface CustomsItem {
  description: string;
  quantity: number;
  value: number;
  weight: number;
  hs_tariff_number?: string;
  origin_country: string;
}

export interface CustomsInfo {
  contents_type: string;
  contents_explanation?: string;
  customs_certify: boolean;
  customs_signer: string;
  non_delivery_option: string;
  eel_pfc?: string;
  items: CustomsItem[];
}

export interface ShipmentParams {
  to_address: Address;
  from_address: Address;
  parcel: Parcel;
  customs_info?: CustomsInfo;
  options?: Record<string, any>;
}

export interface EasyPostRate {
  id: string;
  object: string;
  carrier: string;
  service: string;
  rate: string;
  currency: string;
  delivery_days: number | null;
  delivery_date: string | null;
  delivery_date_guaranteed: boolean;
  est_delivery_days: number | null;
}

export interface EasyPostShipment {
  id: string;
  object: string;
  rates: EasyPostRate[];
  postage_label?: {
    label_url: string;
    label_pdf_url: string;
    label_zpl_url: string;
  };
  tracking_code?: string;
  selected_rate?: EasyPostRate;
}

/**
 * Create a shipment and get rates from EasyPost
 * @param params Shipment parameters
 * @returns EasyPost shipment with rates
 */
export async function createShipment(
  params: ShipmentParams
): Promise<EasyPostShipment> {
  try {
    const shipmentData: any = {
      to_address: params.to_address,
      from_address: params.from_address,
      parcel: params.parcel,
    };

    // Add customs info for international shipments
    if (params.customs_info) {
      shipmentData.customs_info = params.customs_info;
    }

    // Add additional options
    if (params.options) {
      shipmentData.options = params.options;
    }

    const shipment = await client.Shipment.create(shipmentData);
    return shipment as EasyPostShipment;
  } catch (error: any) {
    console.error('EasyPost createShipment error:', error);
    throw new Error(
      `Failed to create shipment: ${error.message || 'Unknown error'}`
    );
  }
}

/**
 * Get rates for an existing shipment
 * @param shipmentId EasyPost shipment ID
 * @returns Array of rates
 */
export async function getRates(shipmentId: string): Promise<EasyPostRate[]> {
  try {
    const shipment = await client.Shipment.retrieve(shipmentId);
    return (shipment.rates || []) as EasyPostRate[];
  } catch (error: any) {
    console.error('EasyPost getRates error:', error);
    throw new Error(
      `Failed to get rates: ${error.message || 'Unknown error'}`
    );
  }
}

/**
 * Purchase a shipping label
 * @param shipmentId EasyPost shipment ID
 * @param rateId EasyPost rate ID to purchase
 * @param label_format Format for the label (default: 'PDF')
 * @returns Shipment with label information
 */
export async function buyLabel(
  shipmentId: string,
  rateId: string,
  label_format: string = 'PDF'
): Promise<EasyPostShipment> {
  try {
    const shipment = await client.Shipment.buy(shipmentId, {
      rate: { id: rateId },
      label_format,
    });

    return shipment as EasyPostShipment;
  } catch (error: any) {
    console.error('EasyPost buyLabel error:', error);
    throw new Error(
      `Failed to buy label: ${error.message || 'Unknown error'}`
    );
  }
}

/**
 * Create shipment and get rates in one call
 * @param params Shipment parameters
 * @returns Shipment with rates
 */
export async function getShipmentRates(
  params: ShipmentParams
): Promise<{ shipment: EasyPostShipment; rates: EasyPostRate[] }> {
  const shipment = await createShipment(params);
  return {
    shipment,
    rates: shipment.rates || [],
  };
}

/**
 * Retrieve an existing shipment
 * @param shipmentId EasyPost shipment ID
 * @returns Shipment details
 */
export async function getShipment(
  shipmentId: string
): Promise<EasyPostShipment> {
  try {
    const shipment = await client.Shipment.retrieve(shipmentId);
    return shipment as EasyPostShipment;
  } catch (error: any) {
    console.error('EasyPost getShipment error:', error);
    throw new Error(
      `Failed to get shipment: ${error.message || 'Unknown error'}`
    );
  }
}
