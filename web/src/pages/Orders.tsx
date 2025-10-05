import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import '../styles/Orders.css';

interface Shipment {
  id: string;
  tracking_code: string;
  carrier: string;
  service: string;
  status: string;
  label_url: string;
  created_at: string;
  to_address: {
    city: string;
    state: string;
    zip: string;
  };
}

export const Orders: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getShipmentHistory();
      setShipments(response.shipments || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch shipment history');
    } finally {
      setLoading(false);
    }
  };

  const filteredShipments = filter === 'all' 
    ? shipments 
    : shipments.filter(s => s.status === filter);

  return (
    <div className="orders">
      <h1>Shipment History</h1>
      
      <div className="filters">
        <button 
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={filter === 'delivered' ? 'active' : ''}
          onClick={() => setFilter('delivered')}
        >
          Delivered
        </button>
        <button 
          className={filter === 'in_transit' ? 'active' : ''}
          onClick={() => setFilter('in_transit')}
        >
          In Transit
        </button>
        <button 
          className={filter === 'pending' ? 'active' : ''}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
      </div>

      {loading && <div className="loading">Loading shipments...</div>}
      {error && <div className="error-message">{error}</div>}

      {!loading && filteredShipments.length === 0 && (
        <div className="no-shipments">
          No shipments found.
        </div>
      )}

      {!loading && filteredShipments.length > 0 && (
        <div className="shipments-table">
          <table>
            <thead>
              <tr>
                <th>Tracking Code</th>
                <th>Carrier</th>
                <th>Service</th>
                <th>Destination</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.map((shipment) => (
                <tr key={shipment.id}>
                  <td>{shipment.tracking_code}</td>
                  <td>{shipment.carrier}</td>
                  <td>{shipment.service}</td>
                  <td>
                    {shipment.to_address.city}, {shipment.to_address.state} {shipment.to_address.zip}
                  </td>
                  <td>
                    <span className={`status ${shipment.status}`}>
                      {shipment.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    {new Date(shipment.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <a 
                      href={shipment.label_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="view-label"
                    >
                      View Label
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
