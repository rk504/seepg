import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { GA4EventSchema } from '@/lib/metrics';
import { z } from 'zod';

const GA4WebhookSchema = z.object({
  measurement_id: z.string(),
  client_id: z.string(),
  events: z.array(GA4EventSchema),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate GA4 webhook
    const webhookData = GA4WebhookSchema.parse(body);
    
    // Check for idempotency using client_id + timestamp
    const idempotencyKey = `${webhookData.client_id}_${Date.now()}`;
    
    for (const event of webhookData.events) {
      if (event.event_name !== 'purchase') continue;

      // Extract coupon information from event parameters
      const couponParam = event.event_params.find(p => p.key === 'coupon');
      const valueParam = event.event_params.find(p => p.key === 'value');
      const currencyParam = event.event_params.find(p => p.key === 'currency');
      
      if (!couponParam?.value?.string_value || !valueParam?.value?.double_value) {
        continue; // Skip events without coupon or value
      }

      const couponCode = couponParam.value.string_value;
      const orderValue = valueParam.value.double_value;
      const currency = currencyParam?.value?.string_value || 'USD';

      // Check for idempotency
      const existingOrder = await db.orders.findUnique({
        externalId: `ga4_${webhookData.client_id}_${event.event_timestamp}`
      });

      if (existingOrder) {
        continue; // Skip duplicate
      }

      // Find or create customer using pseudo_id
      let customer = await db.customers.findUnique({
        email: `${webhookData.client_id}@ga4.anonymous` // Anonymous GA4 user
      });

      if (!customer) {
        customer = await db.customers.create({
          email: `${webhookData.client_id}@ga4.anonymous`,
          first_name: 'GA4',
          last_name: 'User',
          first_order_at: event.event_timestamp,
          lifetime_value: orderValue,
        });
      } else {
        // Update lifetime value
        const newLTV = Number(customer.lifetime_value) + orderValue;
        await db.customers.update({
          id: customer.id
        }, {
          lifetime_value: newLTV
        });
      }

      // Find promo code
      const promoCode = await db.codes.findUnique({
        code: couponCode
      });

      // Estimate discount value (GA4 doesn't provide this directly)
      // For MVP, assume 20% discount on average
      const estimatedDiscountValue = orderValue * 0.2;
      const finalTotal = orderValue - estimatedDiscountValue;

      // Create order
      const order = await db.orders.create({
        external_id: `ga4_${webhookData.client_id}_${event.event_timestamp}`,
        customer_id: customer.id,
        total: finalTotal,
        discount_value: estimatedDiscountValue,
        coupon: couponCode,
        channel: 'GA4',
        owner_id: promoCode?.owner_id || null,
        created_at: event.event_timestamp,
      });

      // Create redemption record if promo code was found
      if (promoCode) {
        await db.codeRedemptions.create({
          code_id: promoCode.id,
          order_id: order.id,
        });
      }
    }

    return NextResponse.json({ 
      message: 'GA4 events processed successfully',
      eventsProcessed: webhookData.events.length
    });

  } catch (error) {
    console.error('Error processing GA4 events:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid GA4 event data',
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'GA4 webhook endpoint ready',
    methods: ['POST'],
    description: 'Accepts GA4 purchase events with coupon tracking'
  });
}
