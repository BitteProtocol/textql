# TextQL Playbooks API Client

A comprehensive TypeScript client and CLI tool for interacting with TextQL's Playbooks API. This tool allows you to create, update, and manage SQL-based playbooks that can be scheduled to run automatically and send results via email.

## Features

- 🚀 **Full API Coverage**: Complete implementation of TextQL Playbooks API
- 🛠️ **TypeScript Support**: Fully typed with comprehensive type definitions
- 🖥️ **CLI Interface**: Easy-to-use command-line interface
- ⚙️ **Configuration Management**: Persistent settings and API key management
- 📊 **Connector Management**: List and manage database connectors
- 📅 **Cron Scheduling**: Support for complex scheduling patterns
- 📧 **Email Notifications**: Configure multiple email recipients
- 🔧 **Error Handling**: Robust error handling and user-friendly messages

## Installation

This project uses Bun as the runtime. Make sure you have Bun installed:

```bash
# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Clone or download this project
cd textql

# Install dependencies
bun install
```

## Quick Start

### 1. Set up your API Key

Get your API key from [TextQL Settings](https://app.textql.com/settings/configuration/api-keys):

```bash
# Using the CLI
bun run index.ts config set-api-key your-api-key-here

# Or set environment variable
export TEXTQL_API_KEY=your-api-key-here
```

### 2. List Available Connectors

```bash
bun run index.ts connectors
```

### 3. Create Your First Playbook

```bash
bun run index.ts create \
  --id="my-first-playbook" \
  --prompt="SELECT COUNT(*) as total_users FROM users" \
  --name="User Count Report" \
  --emails="admin@company.com,analyst@company.com" \
  --connector=213
```

## CLI Usage

### Configuration Commands

```bash
# Set API key
bun run index.ts config set-api-key <your-key>

# Set default connector ID
bun run index.ts config set-connector <connector-id>

# Set default cron schedule
bun run index.ts config set-cron "0 9 * * *"

# View current configuration
bun run index.ts config show
```

### Playbook Management

```bash
# List all connectors
bun run index.ts connectors

# Create a new playbook
bun run index.ts create \
  --id=<playbook-id> \
  --prompt="<sql-query>" \
  --name="<playbook-name>" \
  --emails="email1@example.com,email2@example.com" \
  [--connector=<id>] \
  [--cron="0 13 * * *"]

# Update an existing playbook
bun run index.ts update \
  --id=<playbook-id> \
  [--prompt="<new-sql-query>"] \
  [--name="<new-name>"] \
  [--emails="new@example.com"] \
  [--status=STATUS_ACTIVE|STATUS_INACTIVE]
```

## Programmatic Usage

### Basic Example

```typescript
import { TextQLClient, ConfigManager } from './index.js';

// Initialize client
const configManager = new ConfigManager();
const client = new TextQLClient({
  apiKey: configManager.getApiKey(),
});

// List connectors
const connectors = await client.listConnectors();
console.log('Available connectors:', connectors);

// Create a playbook
const result = await client.createCompletePlaybook({
  playbookId: 'my-playbook-123',
  prompt: 'SELECT * FROM users WHERE created_at > NOW() - INTERVAL 7 DAY',
  name: 'Weekly Active Users',
  emailAddresses: ['admin@company.com'],
  connectorId: 213,
  cronString: '0 9 * * 1', // Every Monday at 9 AM
});

if (result.success) {
  console.log('Playbook created:', result.data);
} else {
  console.error('Error:', result.error);
}
```

### Advanced Example

```typescript
import { TextQLClient } from './index.js';

const client = new TextQLClient({
  apiKey: process.env.TEXTQL_API_KEY!,
});

// Find a specific connector
const postgresConnector = await client.findConnectorByName('postgres');

// Create multiple playbooks
const playbooks = [
  {
    id: 'daily-sales',
    name: 'Daily Sales Report',
    prompt: 'SELECT DATE(created_at) as date, SUM(total) as revenue FROM orders GROUP BY DATE(created_at)',
    emails: ['sales@company.com'],
    cron: '0 8 * * *',
  },
  {
    id: 'weekly-inventory',
    name: 'Weekly Inventory Alert',
    prompt: 'SELECT * FROM products WHERE stock < reorder_level',
    emails: ['inventory@company.com'],
    cron: '0 9 * * 1',
  }
];

for (const playbook of playbooks) {
  await client.createCompletePlaybook({
    ...playbook,
    connectorId: postgresConnector!.id,
  });
}
```

## API Reference

### TextQLClient

#### Methods

- `createPlaybook(playbookId: string)` - Create a new playbook
- `updatePlaybook(playbook: UpdatePlaybookRequest)` - Update an existing playbook
- `getConnectors()` - Get all available connectors
- `createCompletePlaybook(params)` - Create a playbook with full configuration
- `listConnectors()` - List all connectors
- `findConnectorByName(name: string)` - Find a connector by name

### Types

- `Playbook` - Complete playbook configuration
- `UpdatePlaybookRequest` - Request payload for updating playbooks
- `Connector` - Database connector information
- `TextQLConfig` - Client configuration
- `TextQLResponse<T>` - Standardized API response wrapper

## Examples

Run the included examples:

```bash
# Basic usage example
bun run example:basic

# Advanced usage example
bun run example:advanced
```

## Configuration

The tool stores configuration in `~/.textql/config.json`:

```json
{
  "apiKey": "your-api-key",
  "baseUrl": "https://app.textql.com",
  "defaultConnectorId": 213,
  "defaultCronString": "0 13 * * *"
}
```

## Environment Variables

- `TEXTQL_API_KEY` - Your TextQL API key (alternative to config file)

## Error Handling

All API calls return a standardized response:

```typescript
interface TextQLResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    status?: number;
  };
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Check the [TextQL Documentation](https://api.textql.com/docs)
- Open an issue in this repository
- Contact TextQL support
