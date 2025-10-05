import React, { useState } from 'react';
import { AddressForm } from '../components/AddressForm';
import { RateCard } from '../components/RateCard';
import { apiClient } from '../api/client';
import '../styles/RatesCompare.css';

interface Address {
  street1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface Rate {
  id: string;
  carrier: string;
  service: string;
  rate: number;
  delivery_days: number;
  delivery_date: string;
}

export const RatesCompare: React.FC = () => {
  const [fromAddress, setFromAddress] = useState<Address | null>(null);
  const [toAddress, setToAddress] = useState<Address | null>(null);
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weight, setWeight] = useState<number>(16);

  const handleGetRates = async () => {
    if (!fromAddress || !toAddress) {
      setError('Please fill in both addresses');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getRates({
        from_address: fromAddress,
        to_address: toAddress,
        parcel: {
          length: 10,
          width: 8,
          height: 4,
          weight: weight
        }
      });
      setRates(response.rates || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch rates');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rates-compare">
      <h1>Compare Shipping Rates</h1>
      
      <div className="address-forms">
        <div className="address-section">
          <h2>From Address</h2>
          <AddressForm onSubmit={setFromAddress} />
        </div>
        
        <div className="address-section">
          <h2>To Address</h2>
          <AddressForm onSubmit={setToAddress} />
        </div>
      </div>

      <div className="parcel-info">
        <label>
          Weight (oz):
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            min="1"
          />
        </label>
      </div>

      <button 
        onClick={handleGetRates} 
        disabled={loading}
        className="get-rates-btn"
      >
        {loading ? 'Loading...' : 'Get Rates'}
      </button>

      {error && <div className="error-message">{error}</div>}

      {rates.length > 0 && (
        <div className="rates-grid">
          {rates.map((rate) => (
            <RateCard key={rate.id} rate={rate} />
          ))}
        </div>
      )}
    </div>
  );
};
