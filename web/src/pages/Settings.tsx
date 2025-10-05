import React, { useState, useEffect } from 'react';
import '../styles/Settings.css';

interface Settings {
  apiKey: string;
  defaultCarrier: string;
  defaultFromAddress: {
    street1: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    apiKey: '',
    defaultCarrier: 'USPS',
    defaultFromAddress: {
      street1: '',
      city: '',
      state: '',
      zip: '',
      country: 'US'
    }
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('shipmentSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (err) {
        console.error('Failed to load settings', err);
      }
    }
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem('shipmentSettings', JSON.stringify(settings));
      setSaved(true);
      setError(null);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError('Failed to save settings');
    }
  };

  const handleAddressChange = (field: string, value: string) => {
    setSettings({
      ...settings,
      defaultFromAddress: {
        ...settings.defaultFromAddress,
        [field]: value
      }
    });
  };

  return (
    <div className="settings">
      <h1>Settings</h1>
      
      <div className="settings-form">
        <div className="form-section">
          <h2>API Configuration</h2>
          <div className="form-group">
            <label>
              EasyPost API Key:
              <input
                type="password"
                value={settings.apiKey}
                onChange={(e) => setSettings({...settings, apiKey: e.target.value})}
                placeholder="Enter your EasyPost API key"
              />
            </label>
          </div>
          
          <div className="form-group">
            <label>
              Default Carrier:
              <select
                value={settings.defaultCarrier}
                onChange={(e) => setSettings({...settings, defaultCarrier: e.target.value})}
              >
                <option value="USPS">USPS</option>
                <option value="UPS">UPS</option>
                <option value="FedEx">FedEx</option>
                <option value="DHL">DHL</option>
              </select>
            </label>
          </div>
        </div>

        <div className="form-section">
          <h2>Default From Address</h2>
          <div className="form-group">
            <label>
              Street Address:
              <input
                type="text"
                value={settings.defaultFromAddress.street1}
                onChange={(e) => handleAddressChange('street1', e.target.value)}
                placeholder="123 Main St"
              />
            </label>
          </div>
          
          <div className="form-group">
            <label>
              City:
              <input
                type="text"
                value={settings.defaultFromAddress.city}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                placeholder="San Francisco"
              />
            </label>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>
                State:
                <input
                  type="text"
                  value={settings.defaultFromAddress.state}
                  onChange={(e) => handleAddressChange('state', e.target.value)}
                  placeholder="CA"
                  maxLength={2}
                />
              </label>
            </div>
            
            <div className="form-group">
              <label>
                ZIP Code:
                <input
                  type="text"
                  value={settings.defaultFromAddress.zip}
                  onChange={(e) => handleAddressChange('zip', e.target.value)}
                  placeholder="94102"
                />
              </label>
            </div>
          </div>
          
          <div className="form-group">
            <label>
              Country:
              <input
                type="text"
                value={settings.defaultFromAddress.country}
                onChange={(e) => handleAddressChange('country', e.target.value)}
                placeholder="US"
                maxLength={2}
              />
            </label>
          </div>
        </div>

        {saved && <div className="success-message">Settings saved successfully!</div>}
        {error && <div className="error-message">{error}</div>}

        <button onClick={handleSave} className="save-btn">
          Save Settings
        </button>
      </div>
    </div>
  );
};
