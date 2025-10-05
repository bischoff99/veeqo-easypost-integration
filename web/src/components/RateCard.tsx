import React from 'react';
import '../styles/RateCard.css';

interface Rate {
  id: string;
  carrier: string;
  service: string;
  rate: number;
  delivery_days: number;
  delivery_date: string;
}

interface RateCardProps {
  rate: Rate;
}

export const RateCard: React.FC<RateCardProps> = ({ rate }) => {
  return (
    <div className="rate-card">
      <div className="rate-header">
        <h3>{rate.carrier}</h3>
        <div className="rate-price">${rate.rate.toFixed(2)}</div>
      </div>
      
      <div className="rate-details">
        <div className="detail-row">
          <span className="label">Service:</span>
          <span className="value">{rate.service}</span>
        </div>
        
        <div className="detail-row">
          <span className="label">Delivery:</span>
          <span className="value">
            {rate.delivery_days} {rate.delivery_days === 1 ? 'day' : 'days'}
          </span>
        </div>
        
        {rate.delivery_date && (
          <div className="detail-row">
            <span className="label">Est. Date:</span>
            <span className="value">
              {new Date(rate.delivery_date).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
