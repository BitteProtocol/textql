import type {
  TextQLConfig,
  Playbook,
  CreatePlaybookRequest,
  UpdatePlaybookRequest,
  GetConnectorsResponse,
  Connector,
  TextQLResponse,
  TextQLError
} from './types.js';

export class TextQLClient {
  private config: TextQLConfig;
  private baseUrl: string;

  constructor(config: TextQLConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://app.textql.com';
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: unknown
  ): Promise<TextQLResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const headers: Record<string, string> = {
        'Authorization': `ApiKey ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData: TextQLError;
        
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = {
            message: errorText || `HTTP ${response.status}: ${response.statusText}`,
            status: response.status,
          };
        }

        return {
          success: false,
          error: errorData,
        };
      }

      const data = await response.json() as T;
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      };
    }
  }

  /**
   * Create a new playbook
   */
  async createPlaybook(playbookId: string): Promise<TextQLResponse<{ playbook: { id: string } }>> {
    const request: CreatePlaybookRequest = {
      playbook: {
        id: playbookId,
      },
    };

    return this.makeRequest<{ playbook: { id: string } }>('/rpc/public/textql.rpc.public.playbook.PlaybookService/CreatePlaybook', 'POST', request);
  }

  /**
   * Update an existing playbook
   */
  async updatePlaybook(playbook: UpdatePlaybookRequest): Promise<TextQLResponse<Playbook>> {
    return this.makeRequest<Playbook>('/rpc/public/textql.rpc.public.playbook.PlaybookService/UpdatePlaybook', 'POST', playbook);
  }

  /**
   * Get all available connectors
   */
  async getConnectors(): Promise<TextQLResponse<GetConnectorsResponse>> {
    return this.makeRequest<GetConnectorsResponse>('/rpc/public/textql.rpc.public.connector.ConnectorService/GetConnectors', 'POST', {});
  }

  /**
   * Create a complete playbook with all required fields
   */
  async createCompletePlaybook(params: {
    playbookId: string;
    prompt: string;
    name: string;
    emailAddresses: string[];
    connectorId: number;
    cronString?: string;
    status?: 'STATUS_ACTIVE' | 'STATUS_INACTIVE';
  }): Promise<TextQLResponse<Playbook>> {
    const { playbookId, prompt, name, emailAddresses, connectorId, cronString = '0 13 * * *', status = 'STATUS_ACTIVE' } = params;

    // First create the playbook
    const createResult = await this.createPlaybook(playbookId);
    if (!createResult.success) {
      return {
        success: false,
        error: createResult.error,
      };
    }

    // Then update it with the full configuration
    const updateRequest: UpdatePlaybookRequest = {
      prompt,
      name,
      playbookId,
      emailAddresses,
      status,
      paradigmType: 'TYPE_SQL',
      paradigmOptions: {
        connectorId,
      },
      triggerType: 'TRIGGER_TYPE_CRON',
      cronString,
    };

    return this.updatePlaybook(updateRequest);
  }

  /**
   * List all connectors with their details
   */
  async listConnectors(): Promise<Connector[]> {
    const result = await this.getConnectors();
    if (!result.success || !result.data) {
      throw new Error(result.error?.message || 'Failed to fetch connectors');
    }
    return result.data.connectors;
  }

  /**
   * Find a connector by name
   */
  async findConnectorByName(name: string): Promise<Connector | null> {
    const connectors = await this.listConnectors();
    return connectors.find(connector => 
      connector.name.toLowerCase().includes(name.toLowerCase())
    ) || null;
  }
}
