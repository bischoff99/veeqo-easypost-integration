import React, { useState } from 'react';
import { AddressForm } from '../components/AddressForm';
import { RateCard } from '../components/RateCard';
import { apiClient } from '../api/client';
import '../styles/BuyLabel.css';

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

export const BuyLabel: React.FC = () => {
  const [fromAddress, setFromAddress] = useState<Address | null>(null);
  const [toAddress, setToAddress] = useState<Address | null>(null);
  const [rates, setRates] = useState<Rate[]>([]);
  const [selectedRate, setSelectedRate] = useState<Rate | null>(null);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [weight, setWeight] = useState<number>(16);

  const handleGetRates = async () => {
    if (!fromAddress || !toAddress) {
      setError('Please fill in both addresses');
      return;
    }

    setLoading(true);
    setError(null);
    setLabelUrl(null);
    setTrackingCode(null);

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

  const handleBuyLabel = async () => {
    if (!selectedRate) {
      setError('Please select a rate');
      return;
    }

    setPurchasing(true);
    setError(null);

    try {
      const response = await apiClient.buyLabel({
        rate_id: selectedRate.id,
        from_address: fromAddress!,
        to_address: toAddress!,
        parcel: {
          length: 10,
          width: 8,
          height: 4,
          weight: weight
        }
      });
      
      setLabelUrl(response.label_url);
      setTrackingCode(response.tracking_code);
    } catch (err: any) {
      setError(err.message || 'Failed to purchase label');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="buy-label">
      <h1>Buy Shipping Label</h1>
      
      {!labelUrl ? (
        <>
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
            <>
              <h2>Select a Rate</h2>
              <div className="rates-grid">
                {rates.map((rate) => (
                  <div 
                    key={rate.id}
                    onClick={() => setSelectedRate(rate)}
                    className={selectedRate?.id === rate.id ? 'selected' : ''}
                  >
                    <RateCard rate={rate} />
                  </div>
                ))}
              </div>
              
              <button 
                onClick={handleBuyLabel}
                disabled={purchasing || !selectedRate}
                className="buy-btn"
              >
                {purchasing ? 'Purchasing...' : 'Purchase Label'}
              </button>
            </>
          )}
        </>
      ) : (
        <div className="label-purchased">
          <h2>Label Purchased Successfully!</h2>
          <div className="label-info">
            <p><strong>Tracking Code:</strong> {trackingCode}</p>
            <a href={labelUrl} target="_blank" rel="noopener noreferrer" className="download-label">
              Download Label
            </a>
          </div>
          <button onClick={() => {
            setLabelUrl(null);
            setTrackingCode(null);
            setRates([]);
            setSelectedRate(null);
          }} className="new-label-btn">
            Create Another Label
          </button>
        </div>
      )}
    </div>
  );
};
