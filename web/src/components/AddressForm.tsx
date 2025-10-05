import React, { useState } from 'react';
import '../styles/AddressForm.css';

interface Address {
  street1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface AddressFormProps {
  onSubmit: (address: Address) => void;
  initialValues?: Address;
}

export const AddressForm: React.FC<AddressFormProps> = ({ onSubmit, initialValues }) => {
  const [address, setAddress] = useState<Address>(initialValues || {
    street1: '',
    city: '',
    state: '',
    zip: '',
    country: 'US'
  });

  const handleChange = (field: keyof Address, value: string) => {
    setAddress({
      ...address,
      [field]: value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(address);
  };

  return (
    <form onSubmit={handleSubmit} className="address-form">
      <div className="form-group">
        <label>
          Street Address:
          <input
            type="text"
            value={address.street1}
            onChange={(e) => handleChange('street1', e.target.value)}
            placeholder="123 Main St"
            required
          />
        </label>
      </div>

      <div className="form-group">
        <label>
          City:
          <input
            type="text"
            value={address.city}
            onChange={(e) => handleChange('city', e.target.value)}
            placeholder="San Francisco"
            required
          />
        </label>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>
            State:
            <input
              type="text"
              value={address.state}
              onChange={(e) => handleChange('state', e.target.value)}
              placeholder="CA"
              maxLength={2}
              required
            />
          </label>
        </div>

        <div className="form-group">
          <label>
            ZIP Code:
            <input
              type="text"
              value={address.zip}
              onChange={(e) => handleChange('zip', e.target.value)}
              placeholder="94102"
              required
            />
          </label>
        </div>
      </div>

      <div className="form-group">
        <label>
          Country:
          <input
            type="text"
            value={address.country}
            onChange={(e) => handleChange('country', e.target.value)}
            placeholder="US"
            maxLength={2}
            required
          />
        </label>
      </div>

      <button type="submit" className="submit-btn">
        Save Address
      </button>
    </form>
  );
};
