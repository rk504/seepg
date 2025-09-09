# Promo Code Intelligence MVP

AI-powered promo code analytics and ROI tracking for CPG brands. Track incremental value, detect leakage, and optimize promotional campaigns with real-time intelligence.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Supabase account (free tier available)
- npm or yarn

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd promo-code-intelligence
npm install
```

### 2. Supabase Setup

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Set Up Database Schema**:
   - Go to your Supabase dashboard
   - Navigate to **SQL Editor**
   - Copy and paste the contents of `supabase-schema.sql`
   - Click **Run** to create all tables

3. **Configure Environment**:
```bash
# Copy environment variables
cp env.example .env

# Edit .env with your Supabase credentials
# SUPABASE_URL="https://[PROJECT-REF].supabase.co"
# SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
```

4. **Seed with Sample Data**:
```bash
# Seed with sample data
npm run db:seed
```

### 3. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the dashboard.

## 📊 Features

### Core Metrics
- **Promo ROI**: Revenue from discounted orders ÷ Total discount value
- **PVI (Promotional Value Index)**: Incremental Revenue ÷ Promo Spend
- **Leakage Detection**: Percentage of redemptions that don't drive new customers
- **Incremental Revenue**: Revenue from new customers attributed to promo codes

### Dashboard Views
- **Overview**: KPI tiles and summary statistics
- **Promo Codes**: Sortable table with performance metrics
- **Owners**: Influencer/rep/campaign performance leaderboard
- **Leakage Analysis**: Anomaly detection and flag management

### Data Sources
- **Shopify**: Webhook integration for order data
- **GA4**: Purchase event tracking with coupon attribution
- **Manual Upload**: CSV import for historical data

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Data Sources  │    │   API Layer     │    │   Processing    │
│                 │    │                 │    │                 │
│ • Shopify API   │───▶│ • /api/ingest   │───▶│ • Identity      │
│ • GA4 Events    │    │ • Validation    │    │   Stitching     │
│ • Manual Upload │    │ • Idempotency   │    │ • Metrics Calc  │
└─────────────────┘    └─────────────────┘    │ • Anomaly Det.  │
                                              └─────────────────┘
                                                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Dashboard     │◀───│   Database      │◀───│   Storage       │
│                 │    │                 │    │                 │
│ • KPI Overview  │    │ • PostgreSQL    │    │ • Orders        │
│ • Codes Table   │    │ • Prisma ORM    │    │ • Customers     │
│ • Owners Board  │    │ • Snapshots     │    │ • Codes         │
│ • Leakage View  │    │                 │    │ • Redemptions   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── ingest/        # Data ingestion endpoints
│   │   ├── metrics/       # Metrics calculation
│   │   └── export/        # Data export
│   ├── dashboard/         # Dashboard pages
│   └── globals.css        # Global styles
├── lib/                   # Core business logic
│   ├── db.ts             # Database connection
│   ├── metrics.ts        # ROI/PVI calculations
│   ├── anomaly.ts        # Leakage detection
│   └── connectors/       # External API integrations
└── components/           # Reusable UI components
```

## 🔧 API Endpoints

### Data Ingestion
- `POST /api/ingest/shopify` - Shopify order webhooks
- `POST /api/ingest/ga4` - GA4 purchase events

### Metrics
- `GET /api/metrics?type=dashboard` - Dashboard KPIs
- `GET /api/metrics?type=codes` - All promo codes with metrics
- `GET /api/metrics?type=owners` - Owner performance data
- `GET /api/metrics?type=anomalies` - Leakage flags

### Export
- `GET /api/export?type=codes&format=csv` - Export codes data
- `GET /api/export?type=orders&format=csv` - Export orders data
- `GET /api/export?type=owners&format=csv` - Export owners data

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## 🗄️ Database Schema

### Core Tables
- `customers` - Customer profiles and LTV
- `owners` - Influencers, reps, campaigns
- `codes` - Promo codes and metadata
- `orders` - Order data with discount tracking
- `code_redemptions` - Redemption events
- `metrics_snapshots` - Daily aggregated metrics
- `anomaly_flags` - Leakage detection alerts

## 🔌 Live Integrations

### Shopify Setup
1. Create a private app in your Shopify admin
2. Enable webhooks for `orders/create`, `orders/updated`
3. Add credentials to `.env`:
   ```
   SHOPIFY_SHOP_DOMAIN=your-shop.myshopify.com
   SHOPIFY_ACCESS_TOKEN=your-access-token
   SHOPIFY_WEBHOOK_SECRET=your-webhook-secret
   ```

### GA4 Setup
1. Create a GA4 property
2. Set up Measurement API
3. Add credentials to `.env`:
   ```
   GA4_MEASUREMENT_ID=G-XXXXXXXXXX
   GA4_API_SECRET=your-api-secret
   ```

## 📈 Key Metrics Explained

### Promo ROI
```
ROI = Total Revenue from Discounted Orders ÷ Total Discount Value
```
- **Good**: 3x+ (for every $1 in discounts, generate $3+ in revenue)
- **Poor**: <1x (losing money on promotions)

### PVI (Promotional Value Index)
```
PVI = Incremental Revenue ÷ Promo Spend
```
- **Excellent**: 2.0+ (strong incremental value)
- **Good**: 1.0-2.0 (positive incremental value)
- **Poor**: <1.0 (low incremental value)

### Leakage Rate
```
Leakage = 1 - (New Customer Uses ÷ Total Uses)
```
- **Low**: <30% (good new customer acquisition)
- **High**: >70% (mostly repeat customers using codes)

## 🚨 Anomaly Detection

The system automatically flags:
- **Spike Redemptions**: Unusual redemption volume (z-score > 2.5)
- **Low PVI**: PVI below threshold for 3+ consecutive days
- **Leakage Detected**: High leakage rate indicating code sharing
- **Unusual Patterns**: Non-business hours activity, rapid-fire redemptions

## 🔄 Daily Operations

### Automated Jobs
```bash
# Calculate daily snapshots
curl -X POST http://localhost:3000/api/metrics -d '{"action":"calculate_snapshots"}'

# Run anomaly detection
curl -X POST http://localhost:3000/api/metrics -d '{"action":"run_anomaly_detection"}'
```

### Manual Tasks
1. Review anomaly flags daily
2. Export data for analysis
3. Monitor top-performing codes
4. Investigate leakage patterns

## 🛠️ Development

### Database Management
```bash
# Reset database and reseed
npm run db:reset


# Generate new migration
npm run db:migrate

# Or use Supabase Dashboard
# Visit your project dashboard at supabase.com
```

### Code Quality
```bash
# Type checking
npm run type-check

# Linting
npm run lint
```

## 📋 Roadmap

### Week 1 (Current)
- ✅ Core MVP with synthetic data
- ✅ Basic dashboard and metrics
- ✅ Anomaly detection
- ✅ CSV export

### Week 2
- [ ] Live Shopify integration
- [ ] GA4 real-time tracking
- [ ] Advanced filtering and search
- [ ] Email alerts for anomalies

### Week 3
- [ ] PDF executive reports
- [ ] Advanced analytics (cohort analysis)
- [ ] Multi-brand support
- [ ] API rate limiting and caching

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For questions or issues:
1. Check the documentation
2. Review existing issues
3. Create a new issue with detailed description

---

**Built with ❤️ for CPG brands who want to optimize their promotional spend**