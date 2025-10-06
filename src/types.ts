// TextQL API Types

export interface TextQLConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface Playbook {
  id: string;
  prompt: string;
  name: string;
  playbookId: string;
  emailAddresses: string[];
  status: 'STATUS_ACTIVE' | 'STATUS_INACTIVE';
  paradigmType: 'TYPE_SQL';
  paradigmOptions: {
    connectorId: number;
  };
  triggerType: 'TRIGGER_TYPE_CRON';
  cronString: string;
}

export interface CreatePlaybookRequest {
  playbook: {
    id: string;
  };
}

export interface UpdatePlaybookRequest {
  prompt: string;
  name: string;
  playbookId: string;
  emailAddresses: string[];
  status: 'STATUS_ACTIVE' | 'STATUS_INACTIVE';
  paradigmType: 'TYPE_SQL';
  paradigmOptions: {
    connectorId: number;
  };
  triggerType: 'TRIGGER_TYPE_CRON';
  cronString: string;
}

export interface Connector {
  id: number;
  name: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetConnectorsResponse {
  connectors: Connector[];
}

export interface TextQLError {
  message: string;
  code?: string;
  status?: number;
}

export interface TextQLResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: TextQLError;
}
