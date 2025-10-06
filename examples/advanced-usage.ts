#!/usr/bin/env bun

import { TextQLClient, ConfigManager } from '../index.js';
import type { UpdatePlaybookRequest } from '../index.js';

async function advancedExample() {
  console.log('🚀 TextQL Advanced Usage Example\n');

  const configManager = new ConfigManager();
  const apiKey = configManager.getApiKey();
  
  if (!apiKey) {
    console.log('❌ No API key found. Please set it first.');
    return;
  }

  const client = new TextQLClient({ apiKey });

  try {
    // 1. Get connectors and find a specific one
    console.log('🔍 Searching for connectors...');
    const connectors = await client.listConnectors();
    
    // Find a connector by name (case-insensitive)
    const postgresConnector = await client.findConnectorByName('postgres');
    const mysqlConnector = await client.findConnectorByName('mysql');
    
    const selectedConnector = postgresConnector || mysqlConnector || connectors[0];
    
    if (!selectedConnector) {
      console.log('❌ No suitable connector found');
      return;
    }

    console.log(`✅ Using connector: ${selectedConnector.name} (ID: ${selectedConnector.id})\n`);

    // 2. Create multiple playbooks with different configurations
    const playbooks = [
      {
        id: `daily-sales-${Date.now()}`,
        name: 'Daily Sales Report',
        prompt: `
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as orders,
            SUM(total_amount) as revenue
          FROM orders 
          WHERE created_at >= CURDATE() - INTERVAL 1 DAY
          GROUP BY DATE(created_at)
          ORDER BY date DESC
        `,
        emails: ['sales@company.com', 'analytics@company.com'],
        cron: '0 8 * * *', // Daily at 8 AM
      },
      {
        id: `weekly-inventory-${Date.now()}`,
        name: 'Weekly Inventory Alert',
        prompt: `
          SELECT 
            product_name,
            current_stock,
            reorder_level
          FROM products 
          WHERE current_stock <= reorder_level
          ORDER BY (current_stock - reorder_level) ASC
        `,
        emails: ['inventory@company.com'],
        cron: '0 9 * * 1', // Every Monday at 9 AM
      },
      {
        id: `monthly-user-growth-${Date.now()}`,
        name: 'Monthly User Growth Analysis',
        prompt: `
          WITH monthly_users AS (
            SELECT 
              DATE_TRUNC('month', created_at) as month,
              COUNT(*) as new_users
            FROM users
            WHERE created_at >= DATE_TRUNC('month', NOW()) - INTERVAL 12 MONTH
            GROUP BY DATE_TRUNC('month', created_at)
          )
          SELECT 
            month,
            new_users,
            LAG(new_users) OVER (ORDER BY month) as prev_month_users,
            ROUND(
              ((new_users - LAG(new_users) OVER (ORDER BY month))::FLOAT / 
               LAG(new_users) OVER (ORDER BY month) * 100), 2
            ) as growth_percentage
          FROM monthly_users
          ORDER BY month DESC
        `,
        emails: ['growth@company.com', 'ceo@company.com'],
        cron: '0 10 1 * *', // First day of every month at 10 AM
      }
    ];

    console.log('📝 Creating multiple playbooks...\n');

    for (const playbook of playbooks) {
      console.log(`Creating: ${playbook.name}`);
      
      const result = await client.createCompletePlaybook({
        playbookId: playbook.id,
        prompt: playbook.prompt.trim(),
        name: playbook.name,
        emailAddresses: playbook.emails,
        connectorId: selectedConnector.id,
        cronString: playbook.cron,
      });

      if (result.success) {
        console.log(`  ✅ Created successfully (ID: ${playbook.id})`);
      } else {
        console.log(`  ❌ Failed: ${result.error?.message}`);
      }
    }

    // 3. Update one of the playbooks
    console.log('\n🔄 Updating a playbook...');
    const updateRequest: UpdatePlaybookRequest = {
      prompt: `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as orders,
          SUM(total_amount) as revenue,
          AVG(total_amount) as avg_order_value
        FROM orders 
        WHERE created_at >= CURDATE() - INTERVAL 7 DAY
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `,
      name: 'Enhanced Daily Sales Report',
      playbookId: playbooks[0].id,
      emailAddresses: ['sales@company.com', 'analytics@company.com', 'finance@company.com'],
      status: 'STATUS_ACTIVE',
      paradigmType: 'TYPE_SQL',
      paradigmOptions: {
        connectorId: selectedConnector.id,
      },
      triggerType: 'TRIGGER_TYPE_CRON',
      cronString: '0 8 * * *',
    };

    const updateResult = await client.updatePlaybook(updateRequest);
    if (updateResult.success) {
      console.log('✅ Playbook updated successfully!');
    } else {
      console.log('❌ Failed to update playbook:', updateResult.error?.message);
    }

    console.log('\n🎉 Advanced example completed!');
    console.log('\n📋 Summary:');
    console.log(`- Created ${playbooks.length} playbooks`);
    console.log(`- Updated 1 playbook`);
    console.log(`- Using connector: ${selectedConnector.name}`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the example
advancedExample().catch(console.error);
