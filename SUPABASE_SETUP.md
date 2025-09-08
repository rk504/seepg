# Supabase Setup Guide

This guide will help you set up Supabase for the Promo Code Intelligence MVP.

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `promo-code-intelligence`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
6. Click "Create new project"
7. Wait for the project to be created (2-3 minutes)

## 2. Get Your Credentials

### Database URL
1. Go to **Settings** → **Database**
2. Scroll down to **Connection string**
3. Select **URI** tab
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with your database password

Example:
```
postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijklmnop.supabase.co:5432/postgres
```

### Supabase URL and Anon Key
1. Go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (e.g., `https://abcdefghijklmnop.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

## 3. Configure Environment Variables

Create a `.env` file in your project root:

```bash
# Database (Supabase)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?schema=public"
SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"

# Next.js
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Shopify (for live integration)
SHOPIFY_SHOP_DOMAIN="your-shop.myshopify.com"
SHOPIFY_ACCESS_TOKEN="your-access-token"
SHOPIFY_WEBHOOK_SECRET="your-webhook-secret"

# GA4 (for live integration)
GA4_MEASUREMENT_ID="G-XXXXXXXXXX"
GA4_API_SECRET="your-api-secret"
```

## 4. Set Up Database Schema

Run these commands to create the database schema:

```bash
# Generate Prisma client
npm run db:generate

# Push schema to Supabase
npm run db:push

# Seed with sample data
npm run db:seed
```

## 5. Verify Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000)

3. You should see the dashboard with sample data

## 6. Optional: Supabase Dashboard

You can also manage your data through the Supabase dashboard:

1. Go to **Table Editor** in your Supabase dashboard
2. You should see all the tables created by Prisma
3. You can view, edit, and manage data directly

## Troubleshooting

### Connection Issues
- Double-check your DATABASE_URL format
- Ensure your database password is correct
- Verify your project is not paused (free tier has limits)

### Schema Issues
- Make sure you ran `npm run db:push`
- Check the Supabase logs in the dashboard
- Try running `npm run db:reset` to start fresh

### Permission Issues
- Ensure your database user has the correct permissions
- Check if Row Level Security (RLS) is enabled (it shouldn't be for this setup)

## Next Steps

Once Supabase is set up:

1. **Test the API**: Visit `/api/metrics?type=dashboard` to see if data is loading
2. **Explore the Dashboard**: Navigate through all the dashboard pages
3. **Set up Live Integrations**: Configure Shopify and GA4 webhooks
4. **Deploy**: Deploy to Vercel or your preferred platform

## Free Tier Limits

Supabase free tier includes:
- 500MB database storage
- 2GB bandwidth
- 50,000 monthly active users
- 2GB file storage

This is more than enough for development and small production workloads.
