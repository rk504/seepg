import { db } from './db';
import { z } from 'zod';

export interface PromoMetrics {
  codeId: string;
  totalUses: number;
  totalRevenue: number;
  totalDiscount: number;
  newCustomerUses: number;
  newCustomerRevenue: number;
  roi: number;
  pvi: number;
  leakage: number;
}

export interface OwnerMetrics {
  ownerId: string;
  ownerName: string;
  ownerType: string;
  totalCodes: number;
  totalUses: number;
  totalRevenue: number;
  newCustomerUses: number;
  avgPvi: number;
  avgRoi: number;
}

/**
 * Calculate Promo ROI: Revenue from discounted orders ÷ Total discount value
 */
export function calculateROI(revenue: number, discountValue: number): number {
  if (discountValue === 0) return 0;
  return revenue / discountValue;
}

/**
 * Calculate PVI (Promotional Value Index): Incremental Revenue ÷ Promo Spend
 * MVP approximation: New customer revenue ÷ (discount value + budget allocation)
 */
export function calculatePVI(
  newCustomerRevenue: number, 
  discountValue: number, 
  budgetAllocation: number = 0
): number {
  const promoSpend = discountValue + budgetAllocation;
  if (promoSpend === 0) return 0;
  return newCustomerRevenue / promoSpend;
}

/**
 * Calculate leakage: Percentage of redemptions that don't drive new customers
 */
export function calculateLeakage(totalUses: number, newCustomerUses: number): number {
  if (totalUses === 0) return 0;
  return Math.max(0, 1 - (newCustomerUses / totalUses));
}

/**
 * Determine if a customer is new based on order date vs first order date
 */
export function isNewCustomer(orderDate: Date, firstOrderDate: Date): boolean {
  const timeDiff = orderDate.getTime() - firstOrderDate.getTime();
  const daysDiff = timeDiff / (1000 * 3600 * 24);
  return daysDiff <= 1; // Within 1 day of first order
}

/**
 * Calculate metrics for a specific code
 */
export async function calculateCodeMetrics(codeId: string, startDate?: Date, endDate?: Date): Promise<PromoMetrics> {
  try {
    const whereClause: any = { codeId };
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }

    const redemptions = await db.codeRedemptions.findMany(whereClause);

  const totalUses = redemptions.length;
  const totalRevenue = redemptions.reduce((sum, r) => sum + Number(r.orders?.total || 0), 0);
  const totalDiscount = redemptions.reduce((sum, r) => sum + Number(r.orders?.discount_value || 0), 0);

  // Calculate new customer metrics
  const newCustomerRedemptions = redemptions.filter(r => 
    r.orders?.customers && isNewCustomer(
      new Date(r.orders.created_at), 
      new Date(r.orders.customers.first_order_at)
    )
  );
  
  const newCustomerUses = newCustomerRedemptions.length;
  const newCustomerRevenue = newCustomerRedemptions.reduce((sum, r) => sum + Number(r.orders?.total || 0), 0);

    const roi = calculateROI(totalRevenue, totalDiscount);
    const pvi = calculatePVI(newCustomerRevenue, totalDiscount);
    const leakage = calculateLeakage(totalUses, newCustomerUses);

    return {
      codeId,
      totalUses,
      totalRevenue,
      totalDiscount,
      newCustomerUses,
      newCustomerRevenue,
      roi,
      pvi,
      leakage,
    };
  } catch (error) {
    console.error('Error calculating code metrics:', error);
    return {
      codeId,
      totalUses: 0,
      totalRevenue: 0,
      totalDiscount: 0,
      newCustomerUses: 0,
      newCustomerRevenue: 0,
      roi: 0,
      pvi: 0,
      leakage: 0,
    };
  }
}

/**
 * Calculate metrics for an owner (influencer/rep/campaign)
 */
export async function calculateOwnerMetrics(ownerId: string, startDate?: Date, endDate?: Date): Promise<OwnerMetrics> {
  const owner = await db.owners.findUnique({ id: ownerId });

  if (!owner) {
    throw new Error(`Owner ${ownerId} not found`);
  }

  // Get all codes for this owner
  const allCodes = await db.codes.findMany();
  const ownerCodes = allCodes.filter(code => code.owner_id === ownerId);

  // Get all redemptions for these codes
  let allRedemptions = [];
  for (const code of ownerCodes) {
    const redemptions = await db.codeRedemptions.findMany({ codeId: code.id });
    allRedemptions = allRedemptions.concat(redemptions);
  }

  // Filter by date range if provided
  if (startDate || endDate) {
    allRedemptions = allRedemptions.filter(r => {
      const createdAt = new Date(r.created_at);
      if (startDate && createdAt < startDate) return false;
      if (endDate && createdAt > endDate) return false;
      return true;
    });
  }

  const totalCodes = ownerCodes.length;
  const totalUses = allRedemptions.length;
  const totalRevenue = allRedemptions.reduce((sum, r) => sum + Number(r.orders?.total || 0), 0);
  
  const newCustomerUses = allRedemptions.filter(r => 
    r.orders?.customers && isNewCustomer(
      new Date(r.orders.created_at), 
      new Date(r.orders.customers.first_order_at)
    )
  ).length;

  // Calculate average PVI and ROI across all codes
  const codeMetrics = await Promise.all(
    ownerCodes.map(code => calculateCodeMetrics(code.id, startDate, endDate))
  );

  const avgPvi = codeMetrics.length > 0 
    ? codeMetrics.reduce((sum, m) => sum + m.pvi, 0) / codeMetrics.length 
    : 0;

  const avgRoi = codeMetrics.length > 0 
    ? codeMetrics.reduce((sum, m) => sum + m.roi, 0) / codeMetrics.length 
    : 0;

  return {
    ownerId: owner.id,
    ownerName: owner.name,
    ownerType: owner.type,
    totalCodes,
    totalUses,
    totalRevenue,
    newCustomerUses,
    avgPvi,
    avgRoi,
  };
}

/**
 * Get dashboard KPIs
 */
export async function getDashboardKPIs(startDate?: Date, endDate?: Date) {
  try {
    const whereClause: any = {};
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }

    const redemptions = await db.codeRedemptions.findMany(whereClause);

    const totalPromoSpend = redemptions.reduce((sum, r) => sum + Number(r.orders?.discount_value || 0), 0);
    const totalRevenue = redemptions.reduce((sum, r) => sum + Number(r.orders?.total || 0), 0);
    
    const newCustomerRedemptions = redemptions.filter(r => 
      r.orders?.customers && isNewCustomer(
        new Date(r.orders.created_at), 
        new Date(r.orders.customers.first_order_at)
      )
    );
    const incrementalRevenue = newCustomerRedemptions.reduce((sum, r) => sum + Number(r.orders?.total || 0), 0);
    
    const avgPvi = totalPromoSpend > 0 ? incrementalRevenue / totalPromoSpend : 0;
    const leakage = redemptions.length > 0 
      ? Math.max(0, 1 - (newCustomerRedemptions.length / redemptions.length)) 
      : 0;

    return {
      totalPromoSpend,
      incrementalRevenue,
      avgPvi,
      leakage: leakage * 100, // Convert to percentage
      totalRedemptions: redemptions.length,
      newCustomerRedemptions: newCustomerRedemptions.length,
    };
  } catch (error) {
    console.error('Error fetching dashboard KPIs:', error);
    // Return default values when database is not available
    return {
      totalPromoSpend: 0,
      incrementalRevenue: 0,
      avgPvi: 0,
      leakage: 0,
      totalRedemptions: 0,
      newCustomerRedemptions: 0,
    };
  }
}

// Validation schemas
export const ShopifyOrderSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  total_price: z.string().transform(Number),
  discount_codes: z.array(z.object({
    code: z.string(),
    amount: z.string().transform(Number),
  })).optional(),
  created_at: z.string().transform(d => new Date(d)),
  customer: z.object({
    id: z.number(),
    email: z.string().email(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    created_at: z.string().transform(d => new Date(d)),
  }),
  source_name: z.string().optional(),
});

export const GA4EventSchema = z.object({
  event_name: z.literal('purchase'),
  event_timestamp: z.string().transform(t => new Date(parseInt(t) / 1000)),
  user_pseudo_id: z.string(),
  event_params: z.array(z.object({
    key: z.string(),
    value: z.object({
      string_value: z.string().optional(),
      double_value: z.number().optional(),
    }),
  })),
});
