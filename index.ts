#!/usr/bin/env bun

// Re-export everything for easy importing
export { TextQLClient } from './src/textql-client.js';
export { ConfigManager } from './src/config.js';
export type {
  TextQLConfig,
  Playbook,
  CreatePlaybookRequest,
  UpdatePlaybookRequest,
  Connector,
  GetConnectorsResponse,
  TextQLError,
  TextQLResponse
} from './src/types.js';

// If this file is run directly, start the CLI
if (import.meta.main) {
  const { TextQLCLI } = await import('./src/cli.js');
  const cli = new TextQLCLI();
  await cli.run(process.argv.slice(2));
}