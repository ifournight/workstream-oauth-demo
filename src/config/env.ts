/**
 * Centralized environment configuration
 * All environment variables are defined here for better maintainability
 */

export interface EnvConfig {
  // Hydra Configuration
  hydraPublicUrl: string;
  hydraAdminUrl: string;
  
  // UMS Configuration
  umsBaseUrl: string;
  
  // OAuth Client Configuration
  clientId: string;
  clientSecret: string;
  
  // Server Configuration
  port: number;
  
  // API Testing Configuration
  testApiUrl: string;
  companyId: string;
}

/**
 * Load and validate environment configuration
 */
export function loadConfig(): EnvConfig {
  const config: EnvConfig = {
    // Hydra Configuration
    hydraPublicUrl: process.env.HYDRA_PUBLIC_URL || 'https://hydra-public.priv.dev.workstream.is',
    hydraAdminUrl: process.env.HYDRA_ADMIN_URL || 'https://hydra-admin.priv.dev.workstream.is',
    
    // UMS Configuration
    umsBaseUrl: process.env.UMS_BASE_URL || '',
    
    // OAuth Client Configuration
    clientId: process.env.CLIENT_ID || '',
    clientSecret: process.env.CLIENT_SECRET || '',
    
    // Server Configuration
    port: parseInt(process.env.PORT || '3000', 10),
    
    // API Testing Configuration
    testApiUrl: process.env.TEST_API_URL || 'https://ws-public-api.dev.workstream.us/time-shift/v2/managers/time_entries?startDate=2025-12-22&endDate=2025-12-29&locationIds%5B0%5D=6fced117-6a57-49cf-a131-12862a962272&statuses%5B0%5D=ended&statuses%5B1%5D=approved&statuses%5B2%5D=started&sortField=clockIn&sortOrder=desc&limit=50',
    companyId: process.env.COMPANY_ID || 'eef568a4-86e4-4b51-bfeb-dc4daa831f6e',
  };

  // Log configuration (without sensitive data)
  console.log('Configuration loaded:');
  console.log(`  Hydra Public URL: ${config.hydraPublicUrl}`);
  console.log(`  Hydra Admin URL: ${config.hydraAdminUrl}`);
  console.log(`  UMS Base URL: ${config.umsBaseUrl || 'Not set (use UMS_BASE_URL env var)'}`);
  console.log(`  Client ID: ${config.clientId || 'Not set (use CLIENT_ID env var)'}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  Test API URL: ${config.testApiUrl}`);
  console.log(`  Company ID: ${config.companyId}`);

  return config;
}

// Export singleton instance
export const config = loadConfig();

