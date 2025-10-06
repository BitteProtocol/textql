#!/usr/bin/env bun

import { TextQLClient, ConfigManager } from '../index.js';

async function basicExample() {
  console.log('🚀 TextQL Basic Usage Example\n');

  // Initialize configuration manager
  const configManager = new ConfigManager();
  
  // Get API key (you can also set it via environment variable TEXTQL_API_KEY)
  const apiKey = configManager.getApiKey();
  if (!apiKey) {
    console.log('❌ No API key found. Please set it using:');
    console.log('   textql config set-api-key <your-api-key>');
    console.log('   or set TEXTQL_API_KEY environment variable');
    return;
  }

  // Create TextQL client
  const client = new TextQLClient({
    apiKey,
    baseUrl: configManager.getBaseUrl(),
  });

  try {
    // 1. List available connectors
    console.log('📋 Fetching connectors...');
    const connectors = await client.listConnectors();
    console.log(`Found ${connectors.length} connectors:`);
    connectors.forEach(connector => {
      console.log(`  - ${connector.name} (ID: ${connector.id}, Type: ${connector.type})`);
    });

    // Select first connector safely (noUncheckedIndexedAccess)
    const firstConnector = connectors[0];
    if (!firstConnector) {
      console.log('No connectors found. You may need to set up a database connection in TextQL first.');
      return;
    }

    const connectorId = firstConnector.id;
    console.log(`\n🔌 Using connector: ${firstConnector.name} (ID: ${connectorId})\n`);

    // 2. Create a simple playbook
    console.log('📝 Creating a sample playbook...');
    const playbookId = `example-playbook-${Date.now()}`;
    
    const result = await client.createCompletePlaybook({
      playbookId,
      prompt: 'SELECT COUNT(*) as total_users FROM users WHERE created_at > NOW() - INTERVAL 7 DAY',
      name: 'Weekly User Count Report',
      emailAddresses: ['admin@example.com'],
      connectorId,
      cronString: '0 9 * * 1', // Every Monday at 9 AM
    });

    if (result.success) {
      console.log('✅ Playbook created successfully!');
      console.log('📋 Playbook details:');
      console.log(JSON.stringify(result.data, null, 2));
    } else {
      console.error('❌ Failed to create playbook:', result.error?.message);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the example
basicExample().catch(console.error);
