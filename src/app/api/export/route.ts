import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const format = searchParams.get('format') || 'csv';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    if (format !== 'csv') {
      return NextResponse.json({ error: 'Only CSV format supported' }, { status: 400 });
    }

    let data: any[] = [];
    let filename = 'export.csv';

    switch (type) {
      case 'codes':
        const codes = await db.codes.findMany();

        data = codes.map(code => ({
          code: code.code,
          owner: code.owner?.name || 'Unknown',
          ownerType: code.owner?.type || 'Unknown',
          channel: code.channel,
          campaign: code.campaign,
          issuedAt: code.issued_at,
          isActive: code.is_active,
          totalUses: code.redemptions?.length || 0,
          totalRevenue: code.redemptions?.reduce((sum: number, r: any) => sum + Number(r.order.total), 0) || 0,
          totalDiscount: code.redemptions?.reduce((sum: number, r: any) => sum + Number(r.order.discount_value), 0) || 0,
        }));

        filename = 'codes_export.csv';
        break;

      case 'orders':
        const orders = await db.orders.findMany();

        data = orders.map(order => ({
          orderId: order.id,
          externalId: order.external_id,
          customerEmail: 'N/A', // Would need to join with customers table
          total: order.total,
          discountValue: order.discount_value,
          coupon: order.coupon,
          channel: order.channel,
          owner: 'N/A', // Would need to join with owners table
          ownerType: 'N/A', // Would need to join with owners table
          createdAt: order.created_at,
        }));

        filename = 'orders_export.csv';
        break;

      case 'owners':
        const owners = await db.owners.findMany();

        data = owners.map(owner => ({
          ownerId: owner.id,
          name: owner.name,
          type: owner.type,
          email: owner.email,
          channel: owner.channel,
          totalCodes: 0, // Would need to count codes
          totalUses: 0, // Would need to count redemptions
          totalRevenue: 0, // Would need to sum from orders
          totalDiscount: 0, // Would need to sum from orders
          avgRevenuePerUse: 0,
        }));

        filename = 'owners_export.csv';
        break;

      case 'anomalies':
        const anomalies = await db.anomalyFlags.findMany({});

        data = anomalies.map(anomaly => ({
          id: anomaly.id,
          code: 'N/A', // Would need to join with codes table
          owner: 'N/A', // Would need to join with owners table
          type: anomaly.type,
          severity: anomaly.severity,
          message: anomaly.message,
          isResolved: anomaly.is_resolved,
          createdAt: anomaly.created_at,
          resolvedAt: anomaly.resolved_at || null,
        }));

        filename = 'anomalies_export.csv';
        break;

      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
    }

    // Convert to CSV
    if (data.length === 0) {
      return NextResponse.json({ error: 'No data to export' }, { status: 404 });
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape CSV values
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
