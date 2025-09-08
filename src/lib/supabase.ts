import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Optional: Create a typed client for better TypeScript support
export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          first_order_at: string;
          lifetime_value: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          first_order_at: string;
          lifetime_value?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          first_order_at?: string;
          lifetime_value?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      owners: {
        Row: {
          id: string;
          type: 'INFLUENCER' | 'REP' | 'CAMPAIGN' | 'PARTNER';
          name: string;
          email: string | null;
          channel: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: 'INFLUENCER' | 'REP' | 'CAMPAIGN' | 'PARTNER';
          name: string;
          email?: string | null;
          channel?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: 'INFLUENCER' | 'REP' | 'CAMPAIGN' | 'PARTNER';
          name?: string;
          email?: string | null;
          channel?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      codes: {
        Row: {
          id: string;
          code: string;
          owner_id: string;
          issued_at: string;
          channel: string;
          campaign: string | null;
          budget: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          owner_id: string;
          issued_at: string;
          channel: string;
          campaign?: string | null;
          budget?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          owner_id?: string;
          issued_at?: string;
          channel?: string;
          campaign?: string | null;
          budget?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          external_id: string | null;
          customer_id: string;
          total: number;
          discount_value: number;
          coupon: string | null;
          channel: string;
          owner_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          external_id?: string | null;
          customer_id: string;
          total: number;
          discount_value?: number;
          coupon?: string | null;
          channel: string;
          owner_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          external_id?: string | null;
          customer_id?: string;
          total?: number;
          discount_value?: number;
          coupon?: string | null;
          channel?: string;
          owner_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      code_redemptions: {
        Row: {
          id: string;
          code_id: string;
          order_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          code_id: string;
          order_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          code_id?: string;
          order_id?: string;
          created_at?: string;
        };
      };
      metrics_snapshots: {
        Row: {
          id: string;
          code_id: string;
          date: string;
          total_uses: number;
          total_revenue: number;
          total_discount: number;
          new_customer_uses: number;
          new_customer_revenue: number;
          roi: number;
          pvi: number;
          leakage: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          code_id: string;
          date: string;
          total_uses?: number;
          total_revenue?: number;
          total_discount?: number;
          new_customer_uses?: number;
          new_customer_revenue?: number;
          roi?: number;
          pvi?: number;
          leakage?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          code_id?: string;
          date?: string;
          total_uses?: number;
          total_revenue?: number;
          total_discount?: number;
          new_customer_uses?: number;
          new_customer_revenue?: number;
          roi?: number;
          pvi?: number;
          leakage?: number;
          created_at?: string;
        };
      };
      anomaly_flags: {
        Row: {
          id: string;
          code_id: string;
          type: 'SPIKE_REDEMPTION' | 'LEAKAGE_DETECTED' | 'LOW_PVI' | 'UNUSUAL_PATTERN';
          severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
          message: string;
          metadata: any;
          is_resolved: boolean;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          code_id: string;
          type: 'SPIKE_REDEMPTION' | 'LEAKAGE_DETECTED' | 'LOW_PVI' | 'UNUSUAL_PATTERN';
          severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
          message: string;
          metadata?: any;
          is_resolved?: boolean;
          created_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          code_id?: string;
          type?: 'SPIKE_REDEMPTION' | 'LEAKAGE_DETECTED' | 'LOW_PVI' | 'UNUSUAL_PATTERN';
          severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
          message?: string;
          metadata?: any;
          is_resolved?: boolean;
          created_at?: string;
          resolved_at?: string | null;
        };
      };
    };
  };
};

export const supabaseTyped = createClient<Database>(supabaseUrl, supabaseAnonKey);
