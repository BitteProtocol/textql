import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export interface TextQLConfigFile {
  apiKey?: string;
  baseUrl?: string;
  defaultConnectorId?: number;
  defaultCronString?: string;
}

export class ConfigManager {
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || join(homedir(), '.textql', 'config.json');
  }

  /**
   * Load configuration from file
   */
  loadConfig(): TextQLConfigFile {
    try {
      if (!existsSync(this.configPath)) {
        return {};
      }
      
      const configData = readFileSync(this.configPath, 'utf-8');
      return JSON.parse(configData);
    } catch (error) {
      console.warn('Failed to load config file:', error);
      return {};
    }
  }

  /**
   * Save configuration to file
   */
  saveConfig(config: TextQLConfigFile): void {
    try {
      // Ensure directory exists
      const { mkdirSync } = require('fs');
      const { dirname } = require('path');
      mkdirSync(dirname(this.configPath), { recursive: true });

      writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      throw new Error(`Failed to save config: ${error}`);
    }
  }

  /**
   * Get API key from config or environment
   */
  getApiKey(): string | null {
    const config = this.loadConfig();
    return config.apiKey || process.env.TEXTQL_API_KEY || null;
  }

  /**
   * Set API key in config
   */
  setApiKey(apiKey: string): void {
    const config = this.loadConfig();
    config.apiKey = apiKey;
    this.saveConfig(config);
  }

  /**
   * Get base URL from config or use default
   */
  getBaseUrl(): string {
    const config = this.loadConfig();
    return config.baseUrl || 'https://app.textql.com';
  }

  /**
   * Get default connector ID from config
   */
  getDefaultConnectorId(): number | null {
    const config = this.loadConfig();
    return config.defaultConnectorId || null;
  }

  /**
   * Set default connector ID
   */
  setDefaultConnectorId(connectorId: number): void {
    const config = this.loadConfig();
    config.defaultConnectorId = connectorId;
    this.saveConfig(config);
  }

  /**
   * Get default cron string
   */
  getDefaultCronString(): string {
    const config = this.loadConfig();
    return config.defaultCronString || '0 13 * * *';
  }

  /**
   * Set default cron string
   */
  setDefaultCronString(cronString: string): void {
    const config = this.loadConfig();
    config.defaultCronString = cronString;
    this.saveConfig(config);
  }
}
