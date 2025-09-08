/**
 * Shopify Admin API Connector
 * 
 * This file contains the live Shopify integration logic.
 * Replace the webhook stubs in /api/ingest/shopify/route.ts with these functions
 * when ready to connect to a real Shopify store.
 */

import { z } from 'zod';

// Shopify API Configuration
const SHOPIFY_SHOP_DOMAIN = process.env.SHOPIFY_SHOP_DOMAIN;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET;

if (!SHOPIFY_SHOP_DOMAIN || !SHOPIFY_ACCESS_TOKEN) {
  console.warn('Shopify credentials not configured. Using stub mode.');
}

/**
 * Verify Shopify webhook signature
 */
export function verifyShopifyWebhook(body: string, signature: string): boolean {
  if (!SHOPIFY_WEBHOOK_SECRET) {
    console.warn('Shopify webhook secret not configured. Skipping verification.');
    return true; // Allow in development
  }

  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', SHOPIFY_WEBHOOK_SECRET);
  hmac.update(body, 'utf8');
  const hash = hmac.digest('base64');
  
  return hash === signature;
}

/**
 * Fetch orders from Shopify Admin API
 */
export async function fetchShopifyOrders(params: {
  limit?: number;
  status?: string;
  created_at_min?: string;
  created_at_max?: string;
  fields?: string;
}) {
  if (!SHOPIFY_SHOP_DOMAIN || !SHOPIFY_ACCESS_TOKEN) {
    throw new Error('Shopify credentials not configured');
  }

  const baseUrl = `https://${SHOPIFY_SHOP_DOMAIN}/admin/api/2023-10`;
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.append(key, value);
  });

  const url = `${baseUrl}/orders.json?${searchParams.toString()}`;
  
  const response = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch customers from Shopify Admin API
 */
export async function fetchShopifyCustomers(params: {
  limit?: number;
  created_at_min?: string;
  created_at_max?: string;
  fields?: string;
}) {
  if (!SHOPIFY_SHOP_DOMAIN || !SHOPIFY_ACCESS_TOKEN) {
    throw new Error('Shopify credentials not configured');
  }

  const baseUrl = `https://${SHOPIFY_SHOP_DOMAIN}/admin/api/2023-10`;
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.append(key, value);
  });

  const url = `${baseUrl}/customers.json?${searchParams.toString()}`;
  
  const response = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch discount codes from Shopify Admin API
 */
export async function fetchShopifyDiscountCodes(params: {
  limit?: number;
  status?: string;
  created_at_min?: string;
  created_at_max?: string;
}) {
  if (!SHOPIFY_SHOP_DOMAIN || !SHOPIFY_ACCESS_TOKEN) {
    throw new Error('Shopify credentials not configured');
  }

  const baseUrl = `https://${SHOPIFY_SHOP_DOMAIN}/admin/api/2023-10`;
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.append(key, value);
  });

  const url = `${baseUrl}/price_rules.json?${searchParams.toString()}`;
  
  const response = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Test Shopify connection
 */
export async function testShopifyConnection(): Promise<boolean> {
  try {
    if (!SHOPIFY_SHOP_DOMAIN || !SHOPIFY_ACCESS_TOKEN) {
      return false;
    }

    const baseUrl = `https://${SHOPIFY_SHOP_DOMAIN}/admin/api/2023-10`;
    const response = await fetch(`${baseUrl}/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Shopify connection test failed:', error);
    return false;
  }
}

/**
 * Sync all orders from Shopify (for initial setup)
 */
export async function syncAllShopifyOrders() {
  if (!SHOPIFY_SHOP_DOMAIN || !SHOPIFY_ACCESS_TOKEN) {
    throw new Error('Shopify credentials not configured');
  }

  console.log('🔄 Starting Shopify orders sync...');
  
  let allOrders: any[] = [];
  let pageInfo: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const params: any = {
      limit: 250,
      status: 'any',
      fields: 'id,order_number,email,total_price,discount_codes,created_at,customer,source_name,line_items',
    };

    if (pageInfo) {
      params.page_info = pageInfo;
    }

    const response = await fetchShopifyOrders(params);
    allOrders = allOrders.concat(response.orders);

    // Check for pagination
    const linkHeader = response.headers?.link;
    if (linkHeader && linkHeader.includes('rel="next"')) {
      const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
      if (nextMatch) {
        const nextUrl = new URL(nextMatch[1]);
        pageInfo = nextUrl.searchParams.get('page_info');
      } else {
        hasNextPage = false;
      }
    } else {
      hasNextPage = false;
    }

    console.log(`📦 Fetched ${allOrders.length} orders so far...`);
  }

  console.log(`✅ Shopify sync completed. Total orders: ${allOrders.length}`);
  return allOrders;
}

/**
 * Webhook handler for real Shopify integration
 */
export async function handleShopifyWebhook(body: any, signature: string) {
  // Verify webhook signature
  if (!verifyShopifyWebhook(JSON.stringify(body), signature)) {
    throw new Error('Invalid webhook signature');
  }

  // Process the webhook based on topic
  const topic = body.topic || 'unknown';
  
  switch (topic) {
    case 'orders/create':
    case 'orders/updated':
    case 'orders/paid':
      return await processShopifyOrder(body);
    
    case 'customers/create':
    case 'customers/update':
      return await processShopifyCustomer(body);
    
    default:
      console.log(`Unhandled webhook topic: ${topic}`);
      return { message: 'Webhook received but not processed' };
  }
}

async function processShopifyOrder(webhookData: any) {
  // This would integrate with your existing order processing logic
  // For now, just return the data structure
  return {
    message: 'Order processed',
    orderId: webhookData.id,
    email: webhookData.email,
    total: webhookData.total_price,
  };
}

async function processShopifyCustomer(webhookData: any) {
  // This would integrate with your existing customer processing logic
  return {
    message: 'Customer processed',
    customerId: webhookData.id,
    email: webhookData.email,
  };
}

// Example usage in your API route:
/*
import { handleShopifyWebhook } from '@/lib/connectors/shopify';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const signature = request.headers.get('x-shopify-hmac-sha256');
  
  try {
    const result = await handleShopifyWebhook(body, signature);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
*/
