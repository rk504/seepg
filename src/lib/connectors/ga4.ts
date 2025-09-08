/**
 * Google Analytics 4 (GA4) Measurement API Connector
 * 
 * This file contains the live GA4 integration logic.
 * Replace the webhook stubs in /api/ingest/ga4/route.ts with these functions
 * when ready to connect to GA4.
 */

import { z } from 'zod';

// GA4 Configuration
const GA4_MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID;
const GA4_API_SECRET = process.env.GA4_API_SECRET;

if (!GA4_MEASUREMENT_ID || !GA4_API_SECRET) {
  console.warn('GA4 credentials not configured. Using stub mode.');
}

/**
 * Send event to GA4 Measurement API
 */
export async function sendGA4Event(event: {
  name: string;
  parameters: Record<string, any>;
  client_id: string;
  user_id?: string;
}) {
  if (!GA4_MEASUREMENT_ID || !GA4_API_SECRET) {
    throw new Error('GA4 credentials not configured');
  }

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`;
  
  const payload = {
    client_id: event.client_id,
    user_id: event.user_id,
    events: [{
      name: event.name,
      params: event.parameters,
    }],
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`GA4 API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Send purchase event with coupon tracking to GA4
 */
export async function sendPurchaseEvent(params: {
  client_id: string;
  transaction_id: string;
  value: number;
  currency: string;
  coupon?: string;
  items?: Array<{
    item_id: string;
    item_name: string;
    category: string;
    quantity: number;
    price: number;
  }>;
}) {
  const eventParams: Record<string, any> = {
    transaction_id: params.transaction_id,
    value: params.value,
    currency: params.currency,
  };

  if (params.coupon) {
    eventParams.coupon = params.coupon;
  }

  if (params.items) {
    eventParams.items = params.items;
  }

  return sendGA4Event({
    name: 'purchase',
    parameters: eventParams,
    client_id: params.client_id,
  });
}

/**
 * Query GA4 Data API for purchase events with coupons
 */
export async function queryGA4PurchaseEvents(params: {
  start_date: string;
  end_date: string;
  dimensions?: string[];
  metrics?: string[];
  filters?: string;
}) {
  if (!GA4_MEASUREMENT_ID) {
    throw new Error('GA4 Measurement ID not configured');
  }

  // Note: This requires GA4 Data API credentials (different from Measurement API)
  // You'll need to set up OAuth2 or service account authentication
  console.warn('GA4 Data API integration requires additional setup');
  
  // For now, return mock data structure
  return {
    rows: [],
    rowCount: 0,
    metadata: {
      currencyCode: 'USD',
      timeZone: 'America/New_York',
    },
  };
}

/**
 * Test GA4 connection
 */
export async function testGA4Connection(): Promise<boolean> {
  try {
    if (!GA4_MEASUREMENT_ID || !GA4_API_SECRET) {
      return false;
    }

    // Send a test event
    await sendGA4Event({
      name: 'test_event',
      parameters: {
        test_parameter: 'connection_test',
      },
      client_id: 'test_client_' + Date.now(),
    });

    return true;
  } catch (error) {
    console.error('GA4 connection test failed:', error);
    return false;
  }
}

/**
 * Process GA4 webhook data
 */
export async function processGA4Webhook(webhookData: any) {
  const events = webhookData.events || [];
  const results = [];

  for (const event of events) {
    if (event.name === 'purchase') {
      // Extract coupon information
      const couponParam = event.params?.find((p: any) => p.key === 'coupon');
      const valueParam = event.params?.find((p: any) => p.key === 'value');
      const currencyParam = event.params?.find((p: any) => p.key === 'currency');
      
      if (couponParam?.value?.string_value && valueParam?.value?.double_value) {
        results.push({
          event_name: 'purchase',
          client_id: webhookData.client_id,
          transaction_id: event.params?.find((p: any) => p.key === 'transaction_id')?.value?.string_value,
          value: valueParam.value.double_value,
          currency: currencyParam?.value?.string_value || 'USD',
          coupon: couponParam.value.string_value,
          timestamp: event.timestamp_micros,
        });
      }
    }
  }

  return results;
}

/**
 * Sync historical purchase events from GA4
 */
export async function syncGA4HistoricalData(params: {
  start_date: string;
  end_date: string;
  limit?: number;
}) {
  console.log('🔄 Starting GA4 historical data sync...');
  
  try {
    // This would use the GA4 Data API to fetch historical data
    // For now, return empty array as this requires additional setup
    console.warn('GA4 historical sync requires Data API setup');
    return [];
  } catch (error) {
    console.error('GA4 historical sync failed:', error);
    throw error;
  }
}

/**
 * Real-time GA4 webhook handler
 */
export async function handleGA4Webhook(body: any, signature?: string) {
  // GA4 doesn't use webhook signatures like Shopify
  // Instead, you can validate the data structure
  
  const webhookSchema = z.object({
    measurement_id: z.string(),
    client_id: z.string(),
    events: z.array(z.object({
      name: z.string(),
      params: z.array(z.object({
        key: z.string(),
        value: z.any(),
      })),
      timestamp_micros: z.string().optional(),
    })),
  });

  try {
    const validatedData = webhookSchema.parse(body);
    return await processGA4Webhook(validatedData);
  } catch (error) {
    console.error('GA4 webhook validation failed:', error);
    throw new Error('Invalid GA4 webhook data');
  }
}

/**
 * Get GA4 configuration status
 */
export function getGA4ConfigStatus() {
  return {
    measurement_id_configured: !!GA4_MEASUREMENT_ID,
    api_secret_configured: !!GA4_API_SECRET,
    ready: !!(GA4_MEASUREMENT_ID && GA4_API_SECRET),
  };
}

// Example usage in your API route:
/*
import { handleGA4Webhook } from '@/lib/connectors/ga4';

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  try {
    const results = await handleGA4Webhook(body);
    return NextResponse.json({ 
      message: 'GA4 events processed successfully',
      eventsProcessed: results.length,
      results 
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
*/
