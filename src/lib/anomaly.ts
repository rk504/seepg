import { db } from './db';

// Define types locally 
export type AnomalyType = 'SPIKE_REDEMPTION' | 'LEAKAGE_DETECTED' | 'LOW_PVI' | 'UNUSUAL_PATTERN';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AnomalyDetectionResult {
  codeId: string;
  type: AnomalyType;
  severity: Severity;
  message: string;
  metadata: Record<string, any>;
}

/**
 * Detect redemption spikes using z-score analysis
 */
export async function detectRedemptionSpikes(codeId: string, threshold: number = 2.5): Promise<AnomalyDetectionResult[]> {
  const snapshots = await db.metricsSnapshots.findMany({
    codeId
  });

  if (snapshots.length < 7) return []; // Need at least a week of data

  const uses = snapshots.map(s => s.total_uses);
  const mean = uses.reduce((sum, use) => sum + use, 0) / uses.length;
  const variance = uses.reduce((sum, use) => sum + Math.pow(use - mean, 2), 0) / uses.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return [];

  const latestUses = uses[0];
  const zScore = (latestUses - mean) / stdDev;

  if (zScore > threshold) {
    return [{
      codeId,
      type: 'SPIKE_REDEMPTION' as AnomalyType,
      severity: zScore > 4 ? 'CRITICAL' as Severity : zScore > 3 ? 'HIGH' as Severity : 'MEDIUM' as Severity,
      message: `Unusual spike in redemptions detected (${zScore.toFixed(2)}σ above mean)`,
      metadata: {
        zScore: zScore,
        normalRate: mean,
        actualRate: latestUses,
        spikeFactor: latestUses / mean,
      }
    }];
  }

  return [];
}

/**
 * Detect low PVI patterns
 */
export async function detectLowPVI(codeId: string, threshold: number = 0.5, consecutiveDays: number = 3): Promise<AnomalyDetectionResult[]> {
  const snapshots = await db.metricsSnapshots.findMany({
    codeId
  });

  if (snapshots.length < consecutiveDays) return [];

  const lowPVIDays = snapshots.filter(s => s.pvi < threshold).length;
  
  if (lowPVIDays >= consecutiveDays) {
    const avgPVI = snapshots.reduce((sum, s) => sum + Number(s.pvi), 0) / snapshots.length;
    
    return [{
      codeId,
      type: 'LOW_PVI' as AnomalyType,
      severity: avgPVI < 0.2 ? 'CRITICAL' as Severity : avgPVI < 0.3 ? 'HIGH' as Severity : 'MEDIUM' as Severity,
      message: `PVI below threshold for ${consecutiveDays} consecutive days`,
      metadata: {
        currentPVI: avgPVI,
        threshold,
        consecutiveDays,
      }
    }];
  }

  return [];
}

/**
 * Detect leakage patterns
 */
export async function detectLeakage(codeId: string, threshold: number = 0.7): Promise<AnomalyDetectionResult[]> {
  const snapshots = await db.metricsSnapshots.findMany({
    codeId
  });

  if (snapshots.length < 3) return [];

  const avgLeakage = snapshots.reduce((sum, s) => sum + Number(s.leakage), 0) / snapshots.length;
  
  if (avgLeakage > threshold) {
    return [{
      codeId,
      type: 'LEAKAGE_DETECTED' as AnomalyType,
      severity: avgLeakage > 0.9 ? 'CRITICAL' as Severity : avgLeakage > 0.8 ? 'HIGH' as Severity : 'MEDIUM' as Severity,
      message: `High leakage rate detected - possible code sharing`,
      metadata: {
        leakageRate: avgLeakage,
        threshold,
        totalUses: snapshots.reduce((sum, s) => sum + s.total_uses, 0),
        newCustomerUses: snapshots.reduce((sum, s) => sum + s.new_customer_uses, 0),
      }
    }];
  }

  return [];
}

/**
 * Detect unusual patterns (e.g., codes used outside normal hours, geographic anomalies)
 */
export async function detectUnusualPatterns(codeId: string): Promise<AnomalyDetectionResult[]> {
  const redemptions = await db.codeRedemptions.findMany({
    codeId
  });

  if (redemptions.length < 10) return [];

  const results: AnomalyDetectionResult[] = [];

  // Check for unusual time patterns (redemptions outside 9-5 business hours)
  const businessHoursRedemptions = redemptions.filter(r => {
    const hour = new Date(r.created_at).getHours();
    return hour >= 9 && hour <= 17;
  });

  const businessHoursRatio = businessHoursRedemptions.length / redemptions.length;
  
  if (businessHoursRatio < 0.3) { // Less than 30% during business hours
    results.push({
      codeId,
      type: 'UNUSUAL_PATTERN' as AnomalyType,
      severity: 'MEDIUM' as Severity,
      message: 'Unusual redemption pattern - mostly outside business hours',
      metadata: {
        businessHoursRatio,
        totalRedemptions: redemptions.length,
        businessHoursRedemptions: businessHoursRedemptions.length,
      }
    });
  }

  // Check for rapid-fire redemptions (potential bot activity)
  const rapidRedemptions = [];
  for (let i = 1; i < redemptions.length; i++) {
    const timeDiff = new Date(redemptions[i-1].created_at).getTime() - new Date(redemptions[i].created_at).getTime();
    if (timeDiff < 60000) { // Less than 1 minute apart
      rapidRedemptions.push(i);
    }
  }

  if (rapidRedemptions.length > 3) {
    results.push({
      codeId,
      type: 'UNUSUAL_PATTERN' as AnomalyType,
      severity: 'HIGH' as Severity,
      message: 'Rapid-fire redemptions detected - possible bot activity',
      metadata: {
        rapidRedemptions: rapidRedemptions.length,
        totalRedemptions: redemptions.length,
      }
    });
  }

  return results;
}

/**
 * Run all anomaly detection algorithms for a code
 */
export async function detectAnomalies(codeId: string): Promise<AnomalyDetectionResult[]> {
  const results = await Promise.all([
    detectRedemptionSpikes(codeId),
    detectLowPVI(codeId),
    detectLeakage(codeId),
    detectUnusualPatterns(codeId),
  ]);

  return results.flat();
}

/**
 * Run anomaly detection for all active codes
 */
export async function runAnomalyDetection(): Promise<void> {
  const activeCodes = await db.codes.findManyActive();

  for (const code of activeCodes) {
    const anomalies = await detectAnomalies(code.id);
    
    for (const anomaly of anomalies) {
      await db.anomalyFlags.create({
        code_id: anomaly.codeId,
        type: anomaly.type,
        severity: anomaly.severity,
        message: anomaly.message,
        metadata: anomaly.metadata,
      });
    }
  }
}
