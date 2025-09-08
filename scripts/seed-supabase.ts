import { faker } from '@faker-js/faker';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Use placeholder values if environment variables are not set
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'placeholder-key';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Simple database wrapper for seeding
const db = {
  owners: {
    async create(data: any) {
      const { data: result, error } = await supabase
        .from('owners')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    }
  },
  customers: {
    async create(data: any) {
      const { data: result, error } = await supabase
        .from('customers')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    }
  },
  codes: {
    async create(data: any) {
      const { data: result, error } = await supabase
        .from('codes')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    }
  },
  orders: {
    async create(data: any) {
      const { data: result, error } = await supabase
        .from('orders')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    }
  },
  codeRedemptions: {
    async create(data: any) {
      const { data: result, error } = await supabase
        .from('code_redemptions')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    }
  },
  anomalyFlags: {
    async create(data: any) {
      const { data: result, error } = await supabase
        .from('anomaly_flags')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    }
  }
};

async function main() {
  console.log('🌱 Seeding Supabase database...');
  
  // Check if Supabase is properly configured
  if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder-key') {
    console.log('⚠️  Supabase not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file');
    console.log('   You can copy from env.example and update with your Supabase credentials');
    console.log('   Then run: npm run db:seed');
    process.exit(0);
  }

  // Create owners (influencers, reps, campaigns)
  const owners = [];
  
  // Influencers
  for (let i = 0; i < 10; i++) {
    const owner = await db.owners.create({
      type: 'INFLUENCER',
      name: faker.person.fullName(),
      email: faker.internet.email(),
      channel: faker.helpers.arrayElement(['Instagram', 'TikTok', 'YouTube', 'Twitter']),
    });
    owners.push(owner);
  }

  // Reps
  for (let i = 0; i < 8; i++) {
    const owner = await db.owners.create({
      type: 'REP',
      name: faker.person.fullName(),
      email: faker.internet.email(),
      channel: faker.helpers.arrayElement(['Direct', 'Email', 'Phone', 'LinkedIn']),
    });
    owners.push(owner);
  }

  // Campaigns
  for (let i = 0; i < 7; i++) {
    const owner = await db.owners.create({
      type: 'CAMPAIGN',
      name: faker.company.buzzPhrase(),
      email: null,
      channel: faker.helpers.arrayElement(['Holiday', 'Product Launch', 'Seasonal', 'Partnership']),
    });
    owners.push(owner);
  }

  console.log(`✅ Created ${owners.length} owners`);

  // Create customers
  const customers = [];
  for (let i = 0; i < 500; i++) {
    const customer = await db.customers.create({
      email: faker.internet.email(),
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      first_order_at: faker.date.past({ years: 2 }).toISOString(),
      lifetime_value: faker.number.float({ min: 0, max: 5000, fractionDigits: 2 }),
    });
    customers.push(customer);
  }
  console.log(`✅ Created ${customers.length} customers`);

  // Create promo codes
  const codes = [];
  for (let i = 0; i < 300; i++) {
    const owner = faker.helpers.arrayElement(owners);
    const codePrefix = owner.type === 'INFLUENCER' ? 'INF' : 
                      owner.type === 'REP' ? 'REP' : 'CAMP';
    
    const code = await db.codes.create({
      code: `${codePrefix}${String(i + 1).padStart(4, '0')}${faker.string.alphanumeric(4).toUpperCase()}`,
      owner_id: owner.id,
      issued_at: faker.date.past({ years: 1 }).toISOString(),
      channel: owner.channel || 'Unknown',
      campaign: faker.helpers.arrayElement(['Summer Sale', 'Black Friday', 'New Year', 'Spring Launch', 'Holiday Special']),
      budget: faker.helpers.maybe(() => faker.number.float({ min: 1000, max: 50000, fractionDigits: 2 }), { probability: 0.7 }),
      is_active: faker.datatype.boolean({ probability: 0.85 }),
    });
    codes.push(code);
  }
  console.log(`✅ Created ${codes.length} codes`);

  // Create orders with realistic patterns
  const activeCodes = codes.filter(code => code.is_active);
  
  for (let i = 0; i < 2000; i++) {
    const customer = faker.helpers.arrayElement(customers);
    const isNewCustomer = faker.datatype.boolean({ probability: 0.3 });
    const orderDate = faker.date.between({ 
      from: new Date(customer.first_order_at), 
      to: new Date() 
    });
    
    const baseTotal = faker.number.float({ min: 25, max: 500, fractionDigits: 2 });
    const discountPercent = faker.helpers.arrayElement([0.1, 0.15, 0.2, 0.25, 0.3, 0.5]);
    const discountValue = baseTotal * discountPercent;
    const finalTotal = baseTotal - discountValue;
    
    // 70% of orders use a promo code
    const usePromoCode = faker.datatype.boolean({ probability: 0.7 });
    const selectedCode = usePromoCode ? faker.helpers.arrayElement(activeCodes) : null;
    
    const order = await db.orders.create({
      external_id: `shopify_${faker.string.alphanumeric(10)}`,
      customer_id: customer.id,
      total: finalTotal,
      discount_value: usePromoCode ? discountValue : 0,
      coupon: selectedCode?.code || null,
      channel: faker.helpers.arrayElement(['Direct', 'Social', 'Email', 'Paid Search', 'Organic']),
      owner_id: selectedCode?.owner_id || null,
      created_at: orderDate.toISOString(),
    });

    // Create redemption record if promo code was used
    if (selectedCode) {
      await db.codeRedemptions.create({
        code_id: selectedCode.id,
        order_id: order.id,
      });
    }
  }
  console.log(`✅ Created 2000 orders`);

  // Create some anomaly flags
  const anomalyFlags = [];
  const flagTypes = [
    {
      type: 'SPIKE_REDEMPTION',
      severity: 'HIGH',
      message: 'Unusual spike in redemptions detected',
      metadata: { spikeFactor: 3.2, normalRate: 5, actualRate: 16 },
    },
    {
      type: 'LOW_PVI',
      severity: 'MEDIUM',
      message: 'PVI below threshold for 3 consecutive days',
      metadata: { currentPVI: 0.3, threshold: 0.5 },
    },
    {
      type: 'LEAKAGE_DETECTED',
      severity: 'CRITICAL',
      message: 'High leakage rate detected - possible code sharing',
      metadata: { leakageRate: 0.8, threshold: 0.3 },
    },
  ];

  for (const flag of flagTypes) {
    const code = faker.helpers.arrayElement(activeCodes);
    const anomaly = await db.anomalyFlags.create({
      code_id: code.id,
      type: flag.type as any,
      severity: flag.severity as any,
      message: flag.message,
      metadata: flag.metadata,
    });
    anomalyFlags.push(anomaly);
  }

  console.log(`✅ Created ${anomalyFlags.length} anomaly flags`);

  console.log('🎉 Supabase database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  });
