export interface IntegrationStatus {
  configured: boolean;
  detail: string;
}

export interface HealthIntegrations {
  supabase: IntegrationStatus;
  gemini: IntegrationStatus;
}

export interface BackendHealthResponse {
  status: string;
  service: string;
  version: string;
  environment: string;
  timestamp: string;
  integrations: HealthIntegrations;
}
