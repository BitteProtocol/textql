#!/usr/bin/env bun
import { TextQLClient } from './textql-client.js';
import { ConfigManager } from './config.js';
import type { UpdatePlaybookRequest } from './types.js';

class TextQLCLI {
  private client: TextQLClient | null = null;
  private configManager: ConfigManager;

  constructor() {
    this.configManager = new ConfigManager();
  }

  private async initializeClient(): Promise<void> {
    const apiKey = this.configManager.getApiKey();
    if (!apiKey) {
      console.error('❌ No API key found. Please set it using: textql config set-api-key <your-key>');
      process.exit(1);
    }

    this.client = new TextQLClient({
      apiKey,
      baseUrl: this.configManager.getBaseUrl(),
    });
  }

  private async ensureClient(): Promise<TextQLClient> {
    if (!this.client) {
      await this.initializeClient();
    }
    return this.client!;
  }

  async run(args: string[]): Promise<void> {
    const command = args[0];

    switch (command) {
      case 'config':
        await this.handleConfig(args.slice(1));
        break;
      case 'connectors':
        await this.handleConnectors(args.slice(1));
        break;
      case 'create':
        await this.handleCreate(args.slice(1));
        break;
      case 'update':
        await this.handleUpdate(args.slice(1));
        break;
      case 'help':
      case '--help':
      case '-h':
        this.showHelp();
        break;
      default:
        console.error(`❌ Unknown command: ${command}`);
        this.showHelp();
        process.exit(1);
    }
  }

  private async handleConfig(args: string[]): Promise<void> {
    const subcommand = args[0];

    switch (subcommand) {
      case 'set-api-key':
        const apiKey = args[1];
        if (!apiKey) {
          console.error('❌ Please provide an API key');
          process.exit(1);
        }
        this.configManager.setApiKey(apiKey);
        console.log('✅ API key saved successfully');
        break;
      case 'set-connector':
        const idArg = args[1];
        if (!idArg) {
          console.error('❌ Please provide a connector ID');
          process.exit(1);
        }
        const connectorId = Number.parseInt(idArg, 10);
        if (Number.isNaN(connectorId)) {
          console.error('❌ Please provide a valid connector ID');
          process.exit(1);
        }
        this.configManager.setDefaultConnectorId(connectorId);
        console.log(`✅ Default connector ID set to ${connectorId}`);
        break;
      case 'set-cron':
        const cronString = args[1];
        if (!cronString) {
          console.error('❌ Please provide a cron string');
          process.exit(1);
        }
        this.configManager.setDefaultCronString(cronString);
        console.log(`✅ Default cron string set to ${cronString}`);
        break;
      case 'show':
        const config = this.configManager.loadConfig();
        console.log('📋 Current configuration:');
        console.log(JSON.stringify(config, null, 2));
        break;
      default:
        console.error(`❌ Unknown config command: ${subcommand}`);
        console.log('Available config commands: set-api-key, set-connector, set-cron, show');
        process.exit(1);
    }
  }

  private async handleConnectors(args: string[]): Promise<void> {
    const client = await this.ensureClient();
    
    try {
      const connectors = await client.listConnectors();
      
      if (connectors.length === 0) {
        console.log('📭 No connectors found');
        return;
      }

      console.log('🔌 Available connectors:');
      connectors.forEach(connector => {
        console.log(`  ID: ${connector.id} | Name: ${connector.name} | Type: ${connector.type} | Status: ${connector.status}`);
      });
    } catch (error) {
      console.error('❌ Failed to fetch connectors:', error);
      process.exit(1);
    }
  }

  private async handleCreate(args: string[]): Promise<void> {
    const client = await this.ensureClient();

    // Parse command line arguments
    const playbookId = args.find(arg => arg.startsWith('--id='))?.split('=')[1];
    const prompt = args.find(arg => arg.startsWith('--prompt='))?.split('=')[1];
    const name = args.find(arg => arg.startsWith('--name='))?.split('=')[1];
    const emails = args.find(arg => arg.startsWith('--emails='))?.split('=')[1]?.split(',');
    const connectorId = args.find(arg => arg.startsWith('--connector='))?.split('=')[1];
    const cronString = args.find(arg => arg.startsWith('--cron='))?.split('=')[1];

    if (!playbookId || !prompt || !name || !emails) {
      console.error('❌ Missing required parameters. Usage:');
      console.log('textql create --id=<playbook-id> --prompt="<sql-query>" --name="<playbook-name>" --emails="email1@example.com,email2@example.com" [--connector=<id>] [--cron="0 13 * * *"]');
      process.exit(1);
    }

    const connectorIdNum = connectorId ? parseInt(connectorId) : this.configManager.getDefaultConnectorId();
    if (!connectorIdNum) {
      console.error('❌ No connector ID provided and no default set. Use --connector=<id> or set a default with: textql config set-connector <id>');
      process.exit(1);
    }

    try {
      const result = await client.createCompletePlaybook({
        playbookId,
        prompt,
        name,
        emailAddresses: emails,
        connectorId: connectorIdNum,
        cronString: cronString || this.configManager.getDefaultCronString(),
      });

      if (result.success) {
        console.log('✅ Playbook created successfully!');
        console.log('📋 Playbook details:');
        console.log(JSON.stringify(result.data, null, 2));
      } else {
        console.error('❌ Failed to create playbook:', result.error?.message);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error creating playbook:', error);
      process.exit(1);
    }
  }

  private async handleUpdate(args: string[]): Promise<void> {
    const client = await this.ensureClient();

    // Parse command line arguments
    const playbookId = args.find(arg => arg.startsWith('--id='))?.split('=')[1];
    const prompt = args.find(arg => arg.startsWith('--prompt='))?.split('=')[1];
    const name = args.find(arg => arg.startsWith('--name='))?.split('=')[1];
    const emails = args.find(arg => arg.startsWith('--emails='))?.split('=')[1]?.split(',');
    const connectorId = args.find(arg => arg.startsWith('--connector='))?.split('=')[1];
    const cronString = args.find(arg => arg.startsWith('--cron='))?.split('=')[1];
    const statusArg = args.find(arg => arg.startsWith('--status='))?.split('=')[1];
    const status = (statusArg === 'STATUS_ACTIVE' || statusArg === 'STATUS_INACTIVE')
      ? statusArg
      : undefined;

    if (!playbookId) {
      console.error('❌ Playbook ID is required. Usage:');
      console.log('textql update --id=<playbook-id> [--prompt="<sql-query>"] [--name="<playbook-name>"] [--emails="email1@example.com,email2@example.com"] [--connector=<id>] [--cron="0 13 * * *"] [--status=STATUS_ACTIVE|STATUS_INACTIVE]');
      process.exit(1);
    }

    const connectorIdNum = connectorId ? parseInt(connectorId) : this.configManager.getDefaultConnectorId();
    if (!connectorIdNum) {
      console.error('❌ No connector ID provided and no default set. Use --connector=<id> or set a default with: textql config set-connector <id>');
      process.exit(1);
    }

    try {
      const updateRequest: UpdatePlaybookRequest = {
        prompt: prompt || 'SELECT 1;',
        name: name || 'Updated Playbook',
        playbookId,
        emailAddresses: emails || ['admin@example.com'],
        status: status || 'STATUS_ACTIVE',
        paradigmType: 'TYPE_SQL',
        paradigmOptions: {
          connectorId: connectorIdNum,
        },
        triggerType: 'TRIGGER_TYPE_CRON',
        cronString: cronString || this.configManager.getDefaultCronString(),
      };

      const result = await client.updatePlaybook(updateRequest);

      if (result.success) {
        console.log('✅ Playbook updated successfully!');
        console.log('📋 Updated playbook details:');
        console.log(JSON.stringify(result.data, null, 2));
      } else {
        console.error('❌ Failed to update playbook:', result.error?.message);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error updating playbook:', error);
      process.exit(1);
    }
  }

  private showHelp(): void {
    console.log(`
🚀 TextQL CLI - TextQL Playbooks Management

USAGE:
  textql <command> [options]

COMMANDS:
  config                    Manage configuration
    set-api-key <key>       Set API key
    set-connector <id>      Set default connector ID
    set-cron <string>       Set default cron string
    show                    Show current configuration

  connectors                List available connectors

  create                    Create a new playbook
    --id=<id>              Playbook ID (required)
    --prompt="<query>"     SQL query or instruction (required)
    --name="<name>"        Human-readable name (required)
    --emails="<emails>"    Comma-separated email addresses (required)
    --connector=<id>       Connector ID (optional, uses default if set)
    --cron="<string>"      Cron schedule (optional, defaults to "0 13 * * *")

  update                    Update an existing playbook
    --id=<id>              Playbook ID (required)
    --prompt="<query>"     SQL query or instruction (optional)
    --name="<name>"        Human-readable name (optional)
    --emails="<emails>"    Comma-separated email addresses (optional)
    --connector=<id>       Connector ID (optional)
    --cron="<string>"      Cron schedule (optional)
    --status=<status>      STATUS_ACTIVE or STATUS_INACTIVE (optional)

  help                      Show this help message

EXAMPLES:
  # Set up API key
  textql config set-api-key your-api-key-here

  # List connectors
  textql connectors

  # Set default connector
  textql config set-connector 213

  # Create a playbook
  textql create --id="my-playbook-123" --prompt="SELECT * FROM users WHERE created_at > NOW() - INTERVAL 7 DAY" --name="Weekly Active Users" --emails="admin@company.com,analyst@company.com"

  # Update a playbook
  textql update --id="my-playbook-123" --status=STATUS_INACTIVE

ENVIRONMENT VARIABLES:
  TEXTQL_API_KEY           API key (alternative to config file)
`);
  }
}

// Main execution
async function main() {
  const cli = new TextQLCLI();
  await cli.run(process.argv.slice(2));
}

// Export the CLI class for use in other modules
export { TextQLCLI };

if (import.meta.main) {
  main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
}
