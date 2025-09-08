import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateCodeMetrics, calculateOwnerMetrics, getDashboardKPIs } from '@/lib/metrics';
import { runAnomalyDetection } from '@/lib/anomaly';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    switch (type) {
      case 'dashboard':
        const kpis = await getDashboardKPIs(start, end);
        return NextResponse.json(kpis);

      case 'code':
        if (!id) {
          return NextResponse.json({ error: 'Code ID required' }, { status: 400 });
        }
        const codeMetrics = await calculateCodeMetrics(id, start, end);
        return NextResponse.json(codeMetrics);

      case 'owner':
        if (!id) {
          return NextResponse.json({ error: 'Owner ID required' }, { status: 400 });
        }
        const ownerMetrics = await calculateOwnerMetrics(id, start, end);
        return NextResponse.json(ownerMetrics);

      case 'codes':
        const codes = await db.codes.findMany();

        const codesWithMetrics = await Promise.all(
          codes.map(async (code) => {
            const metrics = await calculateCodeMetrics(code.id, start, end);
            return {
              ...code,
              metrics
            };
          })
        );

        return NextResponse.json(codesWithMetrics);

      case 'owners':
        const owners = await db.owners.findMany();

        const ownersWithMetrics = await Promise.all(
          owners.map(async (owner) => {
            const metrics = await calculateOwnerMetrics(owner.id, start, end);
            return {
              ...owner,
              metrics
            };
          })
        );

        return NextResponse.json(ownersWithMetrics);

      case 'anomalies':
        const anomalies = await db.anomalyFlags.findMany({
          isResolved: false,
          ...(start && end ? {
            createdAt: {
              gte: start,
              lte: end
            }
          } : {})
        });

        return NextResponse.json(anomalies);

      default:
        return NextResponse.json({ error: 'Invalid metrics type' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'run_anomaly_detection':
        await runAnomalyDetection();
        return NextResponse.json({ message: 'Anomaly detection completed' });

      case 'calculate_snapshots':
        // Calculate daily snapshots for all active codes
        const activeCodes = await db.codes.findManyActive();

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        for (const code of activeCodes) {
          const metrics = await calculateCodeMetrics(code.id, yesterday, today);
          
          await db.metricsSnapshots.upsert({
            code_id: code.id,
            date: yesterday.toISOString().split('T')[0],
            total_uses: metrics.totalUses,
            total_revenue: metrics.totalRevenue,
            total_discount: metrics.totalDiscount,
            new_customer_uses: metrics.newCustomerUses,
            new_customer_revenue: metrics.newCustomerRevenue,
            roi: metrics.roi,
            pvi: metrics.pvi,
            leakage: metrics.leakage,
          });
        }

        return NextResponse.json({ message: 'Snapshots calculated successfully' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error processing metrics action:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
