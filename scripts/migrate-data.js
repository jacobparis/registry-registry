// Run this script to migrate old format data to new JSON string format
// Usage: node scripts/migrate-data.js

const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

async function migrateData() {
  console.log('Starting data migration...');
  
  try {
    // Get all subdomain keys
    const keys = await redis.keys('subdomain:*');
    console.log(`Found ${keys.length} subdomains to check`);
    
    if (keys.length === 0) {
      console.log('No data to migrate');
      return;
    }
    
    // Get all values
    const values = await redis.mget(...keys);
    
    let migratedCount = 0;
    
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = values[i];
      const subdomain = key.replace('subdomain:', '');
      
      if (!value) {
        console.log(`Skipping ${subdomain} - no data`);
        continue;
      }
      
      // If the value is already a string (new format), skip
      if (typeof value === 'string') {
        console.log(`Skipping ${subdomain} - already in new format`);
        continue;
      }
      
      // If the value is an object (old format), convert to JSON string
      if (typeof value === 'object' && value !== null) {
        console.log(`Migrating ${subdomain}...`);
        
        // Add default registry array if it doesn't exist
        const migratedData = {
          emoji: value.emoji || '❓',
          createdAt: value.createdAt || Date.now(),
          registry: value.registry || [],
          name: value.name || subdomain,
          description: value.description || `${subdomain} registry`
        };
        
        // Store as JSON string
        await redis.set(key, JSON.stringify(migratedData));
        migratedCount++;
        console.log(`✅ Migrated ${subdomain}`);
      }
    }
    
    console.log(`\n🎉 Migration complete! Migrated ${migratedCount} subdomains.`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

migrateData(); 