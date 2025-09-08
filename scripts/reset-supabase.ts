import { supabase } from '../src/lib/supabase';

async function main() {
  console.log('🔄 Resetting Supabase database...');

  try {
    // Delete all data in reverse order of dependencies
    const tables = [
      'anomaly_flags',
      'metrics_snapshots', 
      'code_redemptions',
      'orders',
      'codes',
      'customers',
      'owners'
    ];

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
      
      if (error) {
        console.warn(`⚠️  Warning deleting ${table}:`, error.message);
      } else {
        console.log(`✅ Cleared ${table}`);
      }
    }

    console.log('🎉 Database reset complete!');
    console.log('Run "npm run db:seed" to populate with sample data');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
}

main();
