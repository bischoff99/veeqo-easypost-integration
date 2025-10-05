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
- **SQLite Persistence**: Order history tracking enabled by default
- **Optional Authentication**: Google OAuth support (disabled by default for open access)

## Quick Start

### Local Development

```bash
# Clone the repository
git clone https://github.com/bischoff99/veeqo-easypost-integration.git
cd veeqo-easypost-integration

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your API keys
# Required: EASYPOST_API_KEY, VEEQO_TOKEN

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The server will start on `http://localhost:3000` by default.

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Required API Keys
EASYPOST_API_KEY=your_easypost_api_key_here  # Get from: https://easypost.com/account/api-keys
VEEQO_TOKEN=your_veeqo_token_here            # Get from: Veeqo Settings > API

# Server Configuration
PORT=3000
NODE_ENV=development

# Database (SQLite) - Enabled by default
ENABLE_DATABASE=true
DATABASE_PATH=./data/orders.db

# Authentication - Disabled by default (open access)
ENABLE_GOOGLE_AUTH=false

# Google OAuth (only if ENABLE_GOOGLE_AUTH=true)
# GOOGLE_CLIENT_ID=your_client_id
# GOOGLE_CLIENT_SECRET=your_client_secret
# GOOGLE_REDIRECT_URI=https://your-domain.com/auth/google/callback
# SESSION_SECRET=your_random_session_secret
```

## Railway Deployment

### Prerequisites
- [Railway account](https://railway.app/) (free tier available)
- GitHub repository connected to Railway

### Deploy to Railway

1. **Create a new project on Railway**
   ```bash
   # Install Railway CLI
   npm i -g @railway/cli
   
   # Login to Railway
   railway login
   
   # Link your project
   railway link
   ```

2. **Set environment variables in Railway dashboard**
   - Go to your project > Variables
   - Add required variables:
     - `EASYPOST_API_KEY`
     - `VEEQO_TOKEN`
     - `PORT` (Railway will set this automatically)
     - `NODE_ENV=production`

3. **Deploy**
   ```bash
   # Manual deployment
   railway up
   
   # Or push to main branch for automatic deployment via GitHub Actions
   git push origin main
   ```

### GitHub Actions Deployment

The repository includes a GitHub Actions workflow (`.github/workflows/deploy-railway.yml`) for automatic deployment:

1. **Set up GitHub Secrets**
   - Go to your repo > Settings > Secrets and variables > Actions
   - Add secret: `RAILWAY_TOKEN`
     - Get token from: Railway dashboard > Account > Tokens
   - (Optional) Add secret: `RAILWAY_SERVICE_NAME`
     - If not provided, defaults to `veeqo-easypost-integration`

2. **Automatic Deployment**
   - Pushes to `main` branch automatically trigger deployment
   - Or manually trigger from Actions tab > Deploy to Railway > Run workflow

### Railway Configuration

The deployment uses:
- **Dockerfile**: Multi-stage build for optimized production image
- **Health checks**: Automatic health monitoring on `/health` endpoint
- **Data persistence**: SQLite database stored in `/app/data`
- **Environment**: Production-optimized with minimal dependencies

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
    "country": "US"
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
  }
}
```

**Response:**
```json
{
  "success": true,
  "rates": [
    {
      "id": "rate_abc123",
      "provider": "easypost",
      "carrier": "USPS",
      "service": "Priority Mail",
      "price": 7.33,
      "currency": "USD",
      "delivery_days": 2,
      "delivery_date": "2025-10-07"
    }
  ],
  "metadata": {
    "total_count": 1,
    "providers": ["easypost"],
    "order_id": "12345"
  }
}
```

### POST /shipments/buy

Purchase a shipping label from the selected provider.

**Request Body:**
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

**Response:**
```json
{
  "success": true,
  "provider": "easypost",
  "tracking_number": "9400111899562537099886",
  "label_url": "https://easypost-files.s3.amazonaws.com/files/label.pdf",
  "timestamp": "2025-10-05T14:35:00.000Z"
}
```

### GET /health

Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-05T14:30:00.000Z"
}
```

## Database & Order History

The application includes SQLite persistence for tracking order history:

- **Enabled by default**: Set `ENABLE_DATABASE=false` to disable
- **Location**: `./data/orders.db` (configurable via `DATABASE_PATH`)
- **Tracks**:
  - Rate fetches
  - Label purchases
  - Tracking numbers
  - Order associations

## Authentication (Optional)

Google OAuth authentication is **disabled by default** for open access. To enable:

1. **Set environment variable**:
   ```env
   ENABLE_GOOGLE_AUTH=true
   ```

2. **Configure Google OAuth**:
   - Create OAuth credentials at [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Set authorized redirect URI: `https://your-domain.com/auth/google/callback`
   - Add to `.env`:
     ```env
     GOOGLE_CLIENT_ID=your_client_id
     GOOGLE_CLIENT_SECRET=your_client_secret
     GOOGLE_REDIRECT_URI=https://your-domain.com/auth/google/callback
     SESSION_SECRET=your_random_session_secret
     ```

3. **Install additional dependencies**:
   ```bash
   npm install passport passport-google-oauth20 express-session @types/passport @types/express-session
   ```

4. **Implementation**:
   - See `src/middleware/auth.ts` for detailed implementation guide
   - OAuth routes will need to be added to `src/index.ts`
   - Frontend login UI will need to be implemented

**Note**: When authentication is disabled (default), all API endpoints are publicly accessible.

## Project Structure

```
src/
├── config/
│   └── mapping.ts          # Carrier/service name mappings
├── database/
│   └── db.ts              # SQLite database for order history
├── middleware/
│   └── auth.ts            # Authentication middleware (optional)
├── providers/
│   ├── easypost.ts        # EasyPost API integration
│   └── veeqo.ts           # Veeqo API integration
├── routes/
│   └── shipments.ts       # API route handlers
├── utils/
│   ├── normalize.ts       # Rate normalization utilities
│   └── policy.ts          # Policy filtering logic
└── index.ts               # Express server entry point

web/                        # Web interface (optional)
.github/workflows/          # GitHub Actions for CI/CD
Dockerfile                  # Railway deployment configuration
```

## Carrier Mapping

The integration normalizes carrier and service names across providers.

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

## Testing

### EasyPost Test Mode
EasyPost provides test API keys (starting with `EZTK`) that don't charge real money:
- Test credit card numbers work for purchasing test labels
- Test labels are fully functional for integration testing
- Use test addresses provided in [EasyPost documentation](https://docs.easypost.com/docs/testing)

### Veeqo Testing
Veeqo does not have a separate sandbox environment:
- Use a test store or test orders for development
- Test allocations can be created without affecting live inventory
- Contact Veeqo support for testing best practices

## License

MIT License - see LICENSE file for details
