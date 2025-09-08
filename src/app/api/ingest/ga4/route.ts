import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
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
      const existingOrder = await prisma.order.findFirst({
        where: { 
          externalId: `ga4_${webhookData.client_id}_${event.event_timestamp}`,
          coupon: couponCode
        }
      });

      if (existingOrder) {
        continue; // Skip duplicate
      }

      // Find or create customer using pseudo_id
      let customer = await prisma.customer.findFirst({
        where: { 
          email: `${webhookData.client_id}@ga4.anonymous` // Anonymous GA4 user
        }
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            email: `${webhookData.client_id}@ga4.anonymous`,
            firstName: 'GA4',
            lastName: 'User',
            firstOrderAt: event.event_timestamp,
            lifetimeValue: orderValue,
          }
        });
      } else {
        // Update lifetime value
        const newLTV = Number(customer.lifetimeValue) + orderValue;
        await prisma.customer.update({
          where: { id: customer.id },
          data: { lifetimeValue: newLTV }
        });
      }

      // Find promo code
      const promoCode = await prisma.code.findUnique({
        where: { code: couponCode },
        include: { owner: true }
      });

      // Estimate discount value (GA4 doesn't provide this directly)
      // For MVP, assume 20% discount on average
      const estimatedDiscountValue = orderValue * 0.2;
      const finalTotal = orderValue - estimatedDiscountValue;

      // Create order
      const order = await prisma.order.create({
        data: {
          externalId: `ga4_${webhookData.client_id}_${event.event_timestamp}`,
          customerId: customer.id,
          total: finalTotal,
          discountValue: estimatedDiscountValue,
          coupon: couponCode,
          channel: 'GA4',
          ownerId: promoCode?.ownerId || null,
          createdAt: event.event_timestamp,
        }
      });

      // Create redemption record if promo code was found
      if (promoCode) {
        await prisma.codeRedemption.create({
          data: {
            codeId: promoCode.id,
            orderId: order.id,
          }
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
