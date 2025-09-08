import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ShopifyOrderSchema } from '@/lib/metrics';
import { z } from 'zod';

const ShopifyWebhookSchema = z.object({
  id: z.number(),
  order_number: z.number(),
  email: z.string().email(),
  total_price: z.string(),
  discount_codes: z.array(z.object({
    code: z.string(),
    amount: z.string(),
  })).optional(),
  created_at: z.string(),
  customer: z.object({
    id: z.number(),
    email: z.string().email(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    created_at: z.string(),
  }),
  source_name: z.string().optional(),
  line_items: z.array(z.object({
    id: z.number(),
    title: z.string(),
    quantity: z.number(),
    price: z.string(),
  })).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate webhook signature (stub for MVP)
    const signature = request.headers.get('x-shopify-hmac-sha256');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // Parse and validate the order data
    const orderData = ShopifyWebhookSchema.parse(body);
    
    // Check for idempotency
    const existingOrder = await db.orders.findUnique({
      externalId: `shopify_${orderData.id}`
    });

    if (existingOrder) {
      return NextResponse.json({ message: 'Order already processed' }, { status: 200 });
    }

    // Find or create customer
    let customer = await db.customers.findUnique({
      email: orderData.email
    });

    if (!customer) {
      customer = await db.customers.create({
        email: orderData.email,
        first_name: orderData.customer.first_name,
        last_name: orderData.customer.last_name,
        first_order_at: new Date(orderData.created_at).toISOString(),
        lifetime_value: parseFloat(orderData.total_price),
      });
    } else {
      // Update lifetime value
      const newLTV = Number(customer.lifetime_value) + parseFloat(orderData.total_price);
      await db.customers.update(
        { id: customer.id },
        { lifetime_value: newLTV }
      );
    }

    // Calculate discount value
    const discountValue = orderData.discount_codes?.reduce((sum, dc) => sum + parseFloat(dc.amount), 0) || 0;
    const finalTotal = parseFloat(orderData.total_price) - discountValue;

    // Find promo code if used
    let promoCode = null;
    let ownerId = null;
    
    if (orderData.discount_codes && orderData.discount_codes.length > 0) {
      const codeString = orderData.discount_codes[0].code;
      promoCode = await db.codes.findUnique({
        code: codeString
      });
      
      if (promoCode) {
        ownerId = promoCode.owner_id;
      }
    }

    // Create order
    const order = await db.orders.create({
      external_id: `shopify_${orderData.id}`,
      customer_id: customer.id,
      total: finalTotal,
      discount_value: discountValue,
      coupon: orderData.discount_codes?.[0]?.code || null,
      channel: orderData.source_name || 'Direct',
      owner_id: ownerId,
      created_at: new Date(orderData.created_at).toISOString(),
    });

    // Create redemption record if promo code was used
    if (promoCode) {
      await db.codeRedemptions.create({
        code_id: promoCode.id,
        order_id: order.id,
      });
    }

    return NextResponse.json({ 
      message: 'Order processed successfully',
      orderId: order.id,
      customerId: customer.id,
      promoCodeUsed: !!promoCode
    });

  } catch (error) {
    console.error('Error processing Shopify order:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid order data',
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
    message: 'Shopify webhook endpoint ready',
    methods: ['POST'],
    description: 'Accepts Shopify order webhooks for promo code tracking'
  });
}
