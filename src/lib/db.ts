import { supabase } from './supabase';

// Database operations using Supabase client
export const db = {
  // Customers
  customers: {
    async findUnique(where: { email: string }) {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('email', where.email)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    
    async create(data: any) {
      const { data: result, error } = await supabase
        .from('customers')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    
    async update(where: { id: string }, data: any) {
      const { data: result, error } = await supabase
        .from('customers')
        .update(data)
        .eq('id', where.id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    
    async findMany() {
      const { data, error } = await supabase
        .from('customers')
        .select('*');
      
      if (error) throw error;
      return data || [];
    }
  },

  // Owners
  owners: {
    async findMany() {
      const { data, error } = await supabase
        .from('owners')
        .select('*');
      
      if (error) throw error;
      return data || [];
    },
    
    async create(data: any) {
      const { data: result, error } = await supabase
        .from('owners')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    
    async findUnique(where: { id: string }) {
      const { data, error } = await supabase
        .from('owners')
        .select(`
          *,
          codes!inner (
            *,
            code_redemptions!inner (
              *,
              orders!inner (
                *,
                customers!inner (*)
              )
            )
          )
        `)
        .eq('id', where.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  },

  // Codes
  codes: {
    async findMany() {
      const { data, error } = await supabase
        .from('codes')
        .select(`
          *,
          owners!inner (*),
          code_redemptions!inner (
            *,
            orders!inner (
              *,
              customers!inner (*)
            )
          )
        `);
      
      if (error) throw error;
      return data || [];
    },
    
    async findUnique(where: { code: string }) {
      const { data, error } = await supabase
        .from('codes')
        .select(`
          *,
          owners!inner (*)
        `)
        .eq('code', where.code)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    
    async create(data: any) {
      const { data: result, error } = await supabase
        .from('codes')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    
    async findManyActive() {
      const { data, error } = await supabase
        .from('codes')
        .select('id')
        .eq('is_active', true);
      
      if (error) throw error;
      return data || [];
    }
  },

  // Orders
  orders: {
    async findUnique(where: { externalId: string }) {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('external_id', where.externalId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    
    async create(data: any) {
      const { data: result, error } = await supabase
        .from('orders')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    
    async findMany() {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers!inner (*),
          code_redemptions!inner (
            *,
            codes!inner (
              *,
              owners!inner (*)
            )
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  },

  // Code Redemptions
  codeRedemptions: {
    async create(data: any) {
      const { data: result, error } = await supabase
        .from('code_redemptions')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    
    async findMany(where: any) {
      let query = supabase
        .from('code_redemptions')
        .select(`
          *,
          orders!inner (
            *,
            customers!inner (*)
          )
        `);
      
      if (where.codeId) {
        query = query.eq('code_id', where.codeId);
      }
      
      if (where.createdAt) {
        if (where.createdAt.gte) {
          query = query.gte('created_at', where.createdAt.gte.toISOString());
        }
        if (where.createdAt.lte) {
          query = query.lte('created_at', where.createdAt.lte.toISOString());
        }
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    }
  },

  // Metrics Snapshots
  metricsSnapshots: {
    async upsert(data: any) {
      const { data: result, error } = await supabase
        .from('metrics_snapshots')
        .upsert(data, { 
          onConflict: 'code_id,date',
          ignoreDuplicates: false 
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    
    async findMany(where: any) {
      let query = supabase
        .from('metrics_snapshots')
        .select('*')
        .order('date', { ascending: false });
      
      if (where.codeId) {
        query = query.eq('code_id', where.codeId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    }
  },

  // Anomaly Flags
  anomalyFlags: {
    async create(data: any) {
      const { data: result, error } = await supabase
        .from('anomaly_flags')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    
    async findMany(where: any) {
      let query = supabase
        .from('anomaly_flags')
        .select(`
          *,
          codes!inner (
            *,
            owners!inner (*)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (where.isResolved !== undefined) {
        query = query.eq('is_resolved', where.isResolved);
      }
      
      if (where.createdAt) {
        if (where.createdAt.gte) {
          query = query.gte('created_at', where.createdAt.gte.toISOString());
        }
        if (where.createdAt.lte) {
          query = query.lte('created_at', where.createdAt.lte.toISOString());
        }
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    }
  }
};
