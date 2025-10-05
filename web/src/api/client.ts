const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Address {
  street1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface Parcel {
  length: number;
  width: number;
  height: number;
  weight: number;
}

interface RatesRequest {
  from_address: Address;
  to_address: Address;
  parcel: Parcel;
}

interface BuyLabelRequest {
  rate_id: string;
  from_address: Address;
  to_address: Address;
  parcel: Parcel;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getRates(data: RatesRequest) {
    return this.request('/shipments/rates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async buyLabel(data: BuyLabelRequest) {
    return this.request('/shipments/buy', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getShipmentHistory() {
    return this.request('/shipments/history', {
      method: 'GET',
    });
  }

  async healthCheck() {
    return this.request('/health', {
      method: 'GET',
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export type { Address, Parcel, RatesRequest, BuyLabelRequest };
