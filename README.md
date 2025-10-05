# Veeqo-EasyPost Integration

A TypeScript/Node.js integration service that provides unified shipping rate comparison and label purchasing across Veeqo and EasyPost platforms.

## Features

- **Multi-Provider Rate Fetching**: Get shipping rates from both EasyPost and Veeqo simultaneously
- **Unified Response Format**: Normalized rate structure across all providers
- **Policy-Based Filtering**: Filter rates by preferred carriers, maximum price, or delivery time
- **Idempotency Support**: SHA-256 based idempotency keys for safe retries
- **Automatic Order Integration**: Fetch Veeqo order details and automatically update with tracking
- **Comprehensive Carrier Support**: USPS, UPS, FedEx, DHL, Royal Mail, DPD, and more
- **Label Format Options**: Support for PDF, PNG, ZPL formats
- **Customs Support**: International shipments with customs declarations
- **TypeScript**: Full type safety with exported interfaces

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
# EasyPost Configuration
EASYPOST_API_KEY=your_easypost_api_key_here
# Use test key for development: EZTKxxxx
# Use production key for live: EZAKxxxx

# Veeqo Configuration
VEEQO_API_KEY=your_veeqo_api_key_here
# Get from: Veeqo Settings > API > Generate API Key

# Server Configuration
PORT=3000
```

## API Endpoints

### POST /shipments/rates

Get unified shipping rates from multiple providers.

**Request Body:**

```json
{
  "orderId": "12345",
  "toAddress": {
    "name": "John Doe",
    "street1": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94105",
    "country": "US",
    "phone": "555-1234"
  },
  "fromAddress": {
    "name": "My Warehouse",
    "street1": "456 Warehouse Blvd",
    "city": "Los Angeles",
    "state": "CA",
    "zip": "90001",
    "country": "US"
  },
  "parcel": {
    "length": 10,
    "width": 8,
    "height": 6,
    "weight": 16
  },
  "policy": {
    "preferred_carriers": ["USPS", "UPS"],
    "max_price": 25.00,
    "max_days": 5
  },
  "filters": {
    "carrier": "USPS",
    "service": "Priority"
  }
}
```

**Notes:**
- If `orderId` is provided, the service will fetch order details from Veeqo and use the delivery address
- Either provide full addresses or an `orderId` with existing Veeqo order
- `parcel` dimensions in inches, weight in ounces
- `policy` and `filters` are optional

**Response:**

```json
{
  "success": true,
  "rates": [
    {
      "id": "rate_abc123",
      "provider": "easypost",
      "carrier": "USPS",
      "carrier_normalized": "USPS",
      "service": "Priority",
      "service_normalized": "Priority Mail",
      "price": 7.33,
      "currency": "USD",
      "delivery_days": 2,
      "delivery_date": "2025-10-07",
      "est_delivery_days": 2,
      "metadata": {
        "shipmentId": "shp_xyz789",
        "rateId": "rate_abc123"
      }
    },
    {
      "id": "veeqo_123_P1",
      "provider": "veeqo",
      "carrier": "Royal Mail",
      "carrier_normalized": "Royal Mail",
      "service": "Tracked 24",
      "service_normalized": "Royal Mail Tracked 24",
      "price": 5.20,
      "currency": "GBP",
      "delivery_days": 1,
      "metadata": {
        "allocationId": 456,
        "carrierId": 123,
        "serviceCode": "P1"
      }
    }
  ],
  "metadata": {
    "total_count": 2,
    "providers": ["easypost", "veeqo"],
    "order_id": "12345"
  },
  "timestamp": "2025-10-05T14:30:00.000Z"
}
```

### POST /shipments/buy

Purchase a shipping label from the selected provider.

**EasyPost Request:**

```json
{
  "provider": "easypost",
  "selection": {
    "shipmentId": "shp_xyz789",
    "rateId": "rate_abc123"
  },
  "context": {
    "orderId": "12345",
    "label_format": "PDF"
  }
}
```

**Veeqo Request:**

```json
{
  "provider": "veeqo",
  "selection": {
    "allocationId": 456,
    "carrierId": 123,
    "serviceCode": "P1"
  },
  "context": {
    "orderId": "12345"
  }
}
```

**Response:**

```json
{
  "success": true,
  "provider": "easypost",
  "shipment": { ... },
  "tracking_number": "9400111899562537099886",
  "label_url": "https://easypost-files.s3.amazonaws.com/files/label.pdf",
  "idempotency_key": "a1b2c3...",
  "timestamp": "2025-10-05T14:35:00.000Z"
}
```

**Notes:**
- The `idempotency_key` is automatically generated based on request content
- If `context.orderId` is provided for EasyPost purchases, Veeqo order will be automatically updated with tracking
- Label formats: `PDF`, `PNG`, `ZPL` (default: `PDF`)

## Usage Examples

### Basic Rate Comparison

```bash
curl -X POST http://localhost:3000/shipments/rates \
  -H "Content-Type: application/json" \
  -d '{
    "toAddress": {
      "street1": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zip": "10001",
      "country": "US"
    },
    "fromAddress": {
      "street1": "456 Warehouse Ave",
      "city": "Los Angeles",
      "state": "CA",
      "zip": "90001",
      "country": "US"
    },
    "parcel": {
      "length": 10,
      "width": 8,
      "height": 6,
      "weight": 16
    }
  }'
```

### Using Veeqo Order ID

```bash
curl -X POST http://localhost:3000/shipments/rates \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "12345",
    "fromAddress": {
      "street1": "456 Warehouse Ave",
      "city": "Los Angeles",
      "state": "CA",
      "zip": "90001",
      "country": "US"
    },
    "parcel": {
      "length": 10,
      "width": 8,
      "height": 6,
      "weight": 16
    }
  }'
```

### Purchase Label

```bash
curl -X POST http://localhost:3000/shipments/buy \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "easypost",
    "selection": {
      "shipmentId": "shp_xyz789",
      "rateId": "rate_abc123"
    },
    "context": {
      "orderId": "12345",
      "label_format": "PDF"
    }
  }'
```

## Project Structure

```
src/
├── config/
│   └── mapping.ts          # Carrier/service name mappings
├── providers/
│   ├── easypost.ts        # EasyPost API integration
│   └── veeqo.ts           # Veeqo API integration
├── routes/
│   └── shipments.ts       # API route handlers
├── utils/
│   ├── normalize.ts       # Rate normalization utilities
│   └── policy.ts          # Policy filtering logic
└── index.ts               # Express server entry point
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Testing

### EasyPost Test Mode

EasyPost provides test API keys (starting with `EZTK`) that don't charge real money:

- Test credit card numbers work for purchasing test labels
- Test labels are fully functional for integration testing
- Use test addresses provided in EasyPost documentation

### Veeqo Sandbox

Veeqo does not have a separate sandbox environment:

- Use a test store or test orders for development
- Test allocations can be created without affecting live inventory
- Contact Veeqo support for testing best practices

## Carrier Mapping

The integration normalizes carrier and service names across providers:

**Supported Carriers:**
- USPS (United States Postal Service)
- UPS (United Parcel Service)
- FedEx
- DHL
- Royal Mail (UK)
- DPD (UK/Europe)
- Evri/Hermes (UK)
- Canada Post

**Custom Mappings:**

You can add custom carrier or service mappings:

```typescript
import { addCarrierMapping, addServiceMapping } from './src/config/mapping';

addCarrierMapping('MyCarrier', 'Custom Carrier Name');
addServiceMapping('USPS', 'CustomService', 'Custom Service Name');
```

## Error Handling

The API returns standard HTTP status codes:

- `200` - Success
- `400` - Bad Request (invalid input)
- `500` - Internal Server Error

Error responses include details:

```json
{
  "success": false,
  "error": "Failed to retrieve shipping rates",
  "message": "Invalid address: postal code required"
}
```

## License

MIT License - see LICENSE file for details
