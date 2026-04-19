import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Neon API interfaces
export interface NeonProject {
  id: string;
  name: string;
  region_id: string;
  created_at: string;
  updated_at: string;
  postgres_version: string;
  default_branch_id: string;
  default_database_name: string;
  default_region_id: string;
  storage_size_limit: number;
  compute_size_limit: number;
}

export interface NeonBranch {
  id: string;
  name: string;
  parent_id: string | null;
  project_id: string;
  created_at: string;
  updated_at: string;
  default: boolean;
  current: boolean;
  is_protected: boolean;
  metadata: Record<string, any>;
}

export interface NeonEndpoint {
  id: string;
  project_id: string;
  branch_id: string;
  type: string;
  host: string;
  region_id: string;
  created_at: string;
  updated_at: string;
  current: boolean;
  pooler_enabled: boolean;
  pooler_host: string;
  autoscaling_limit_min_cu: number;
  autoscaling_limit_max_cu: number;
  settings: {
    pg_version: string;
    max_connections: number;
    statement_timeout: string;
    idle_timeout: string;
    autoscaling_limit_min_cu?: number;
    autoscaling_limit_max_cu?: number;
  };
}

export interface NeonDatabase {
  name: string;
  owner_name: string;
  created_at: string;
}

export interface NeonOperation {
  id: string;
  project_id: string;
  type: string;
  status: string;
  error: string | null;
  created_at: string;
  finished_at: string | null;
  action: {
    branch_id?: string;
    endpoint_id?: string;
    database_name?: string;
    settings?: Record<string, any>;
  };
}

export class NeonAPIManager {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: 'https://api.neon.tech/v2',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000 // 30 seconds
    });

    // Add request/response interceptors for logging
    this.client.interceptors.request.use(
      (config: AxiosRequestConfig) => {
        console.log(`Neon API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error: AxiosError) => {
        console.error('Neon API Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`Neon API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError) => {
        console.error('Neon API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Project Management
  async getProject(projectId: string): Promise<NeonProject> {
    const response = await this.client.get(`/projects/${projectId}`);
    return response.data;
  }

  async listProjects(): Promise<NeonProject[]> {
    const response = await this.client.get('/projects');
    return response.data.projects;
  }

  // Branch Management
  async listBranches(projectId: string): Promise<NeonBranch[]> {
    const response = await this.client.get(`/projects/${projectId}/branches`);
    return response.data.branches;
  }

  async createBranch(projectId: string, branchName: string, parentId?: string): Promise<NeonBranch> {
    const body: any = { branch: { name: branchName } };
    if (parentId) {
      body.branch.parent_id = parentId;
    }

    const response = await this.client.post(`/projects/${projectId}/branches`, body);
    return response.data;
  }

  async deleteBranch(projectId: string, branchId: string): Promise<void> {
    await this.client.delete(`/projects/${projectId}/branches/${branchId}`);
  }

  async protectBranch(projectId: string, branchId: string, isProtected: boolean = true): Promise<NeonBranch> {
    const response = await this.client.patch(`/projects/${projectId}/branches/${branchId}`, {
      branch: { is_protected: isProtected }
    });
    return response.data;
  }

  // Endpoint Management
  async listEndpoints(projectId: string): Promise<NeonEndpoint[]> {
    const response = await this.client.get(`/projects/${projectId}/endpoints`);
    return response.data.endpoints;
  }

  async createEndpoint(projectId: string, branchId: string, settings?: Partial<NeonEndpoint['settings']>): Promise<NeonEndpoint> {
    const body = {
      endpoint: {
        branch_id: branchId,
        type: 'read_write',
        settings: settings || {
          max_connections: 100,
          statement_timeout: '60s',
          idle_timeout: '30s'
        }
      }
    };

    const response = await this.client.post(`/projects/${projectId}/endpoints`, body);
    return response.data;
  }

  async updateEndpoint(projectId: string, endpointId: string, settings: Partial<NeonEndpoint['settings']>): Promise<NeonEndpoint> {
    const response = await this.client.patch(`/projects/${projectId}/endpoints/${endpointId}`, {
      endpoint: { settings }
    });
    return response.data;
  }

  async deleteEndpoint(projectId: string, endpointId: string): Promise<void> {
    await this.client.delete(`/projects/${projectId}/endpoints/${endpointId}`);
  }

  // Database Management
  async listDatabases(projectId: string, branchId: string): Promise<NeonDatabase[]> {
    const response = await this.client.get(`/projects/${projectId}/branches/${branchId}/databases`);
    return response.data.databases;
  }

  async createDatabase(projectId: string, branchId: string, databaseName: string, ownerName: string): Promise<NeonDatabase> {
    const response = await this.client.post(`/projects/${projectId}/branches/${branchId}/databases`, {
      database: {
        name: databaseName,
        owner_name: ownerName
      }
    });
    return response.data;
  }

  async deleteDatabase(projectId: string, branchId: string, databaseName: string): Promise<void> {
    await this.client.delete(`/projects/${projectId}/branches/${branchId}/databases/${databaseName}`);
  }

  // Operations Management
  async getOperation(projectId: string, operationId: string): Promise<NeonOperation> {
    const response = await this.client.get(`/projects/${projectId}/operations/${operationId}`);
    return response.data;
  }

  async listOperations(projectId: string, status?: string): Promise<NeonOperation[]> {
    const url = status 
      ? `/projects/${projectId}/operations?status=${status}`
      : `/projects/${projectId}/operations`;
    
    const response = await this.client.get(url);
    return response.data.operations;
  }

  async waitForOperation(projectId: string, operationId: string, timeoutMs: number = 300000): Promise<NeonOperation> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const operation = await this.getOperation(projectId, operationId);
      
      if (operation.status === 'finished') {
        return operation;
      } else if (operation.status === 'failed') {
        throw new Error(`Operation failed: ${operation.error}`);
      }
      
      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error(`Operation timed out after ${timeoutMs}ms`);
  }

  // Backup and Restore
  async createBranchFromTimestamp(projectId: string, branchName: string, timestamp: string): Promise<NeonBranch> {
    const response = await this.client.post(`/projects/${projectId}/branches`, {
      branch: {
        name: branchName,
        timestamp: timestamp
      }
    });
    return response.data;
  }

  async getRestoreWindow(projectId: string): Promise<{ earliest: string; latest: string }> {
    const response = await this.client.get(`/projects/${projectId}/restore-window`);
    return response.data;
  }

  // Utility Methods
  async getConnectionString(projectId: string, branchId: string, databaseName: string = 'neondb'): Promise<string> {
    const endpoints = await this.listEndpoints(projectId);
    const endpoint = endpoints.find(e => e.branch_id === branchId && e.current);
    
    if (!endpoint) {
      throw new Error(`No current endpoint found for branch ${branchId}`);
    }

    // Get project details to construct connection string
    const project = await this.getProject(projectId);
    
    return `postgresql://${project.default_database_name}_owner:${process.env.NEON_DB_PASSWORD}@${endpoint.host}/${databaseName}?sslmode=require`;
  }

  async getProjectMetrics(projectId: string): Promise<any> {
    const response = await this.client.get(`/projects/${projectId}/metrics`);
    return response.data;
  }

  // High-level workflow methods
  async createDevelopmentBranch(projectId: string, featureName: string): Promise<{
    branch: NeonBranch;
    endpoint: NeonEndpoint;
    connectionString: string;
  }> {
    try {
      // Get main branch
      const branches = await this.listBranches(projectId);
      const mainBranch = branches.find(b => b.default);
      
      if (!mainBranch) {
        throw new Error('No main branch found');
      }

      // Create feature branch
      const branchName = `feature-${featureName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      const branch = await this.createBranch(projectId, branchName, mainBranch.id);

      // Wait for branch creation to complete
      await this.waitForOperation(projectId, branch.id);

      // Create endpoint for the branch
      const endpoint = await this.createEndpoint(projectId, branch.id, {
        max_connections: 20,
        statement_timeout: '30s',
        idle_timeout: '15s'
      });

      // Wait for endpoint creation
      await this.waitForOperation(projectId, endpoint.id);

      // Get connection string
      const connectionString = await this.getConnectionString(projectId, branch.id);

      return {
        branch,
        endpoint,
        connectionString
      };
    } catch (error) {
      console.error('Failed to create development branch:', error);
      throw error;
    }
  }

  async cleanupOldBranches(projectId: string, daysOld: number = 7): Promise<string[]> {
    try {
      const branches = await this.listBranches(projectId);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const oldBranches = branches.filter(branch => 
        !branch.default && 
        !branch.is_protected && 
        new Date(branch.created_at) < cutoffDate
      );

      const deletedBranches: string[] = [];

      for (const branch of oldBranches) {
        try {
          await this.deleteBranch(projectId, branch.id);
          deletedBranches.push(branch.name);
          console.log(`Deleted old branch: ${branch.name}`);
        } catch (error) {
          console.error(`Failed to delete branch ${branch.name}:`, error);
        }
      }

      return deletedBranches;
    } catch (error) {
      console.error('Failed to cleanup old branches:', error);
      throw error;
    }
  }

  async enableAutoscaling(projectId: string, endpointId: string, minCU: number = 0.25, maxCU: number = 2): Promise<NeonEndpoint> {
    return await this.updateEndpoint(projectId, endpointId, {
      autoscaling_limit_min_cu: minCU,
      autoscaling_limit_max_cu: maxCU
    });
  }

  // Health check for Neon API
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; error?: string }> {
    try {
      await this.listProjects();
      return { status: 'healthy' };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const neonAPI = new NeonAPIManager(process.env.NEON_API_KEY || '');

// Helper functions for common operations
export async function setupDevelopmentEnvironment(projectId: string, featureName: string) {
  console.log(`Setting up development environment for feature: ${featureName}`);
  
  const env = await neonAPI.createDevelopmentBranch(projectId, featureName);
  
  console.log(`Development environment ready:`);
  console.log(`  Branch: ${env.branch.name}`);
  console.log(`  Endpoint: ${env.endpoint.host}`);
  console.log(`  Connection string: ${env.connectionString}`);
  
  return env;
}

export async function cleanupDevelopmentEnvironments(projectId: string) {
  console.log('Cleaning up old development environments...');
  
  const deletedBranches = await neonAPI.cleanupOldBranches(projectId, 7);
  
  console.log(`Cleaned up ${deletedBranches.length} old branches:`);
  deletedBranches.forEach(name => console.log(`  - ${name}`));
  
  return deletedBranches;
}
