/**
 * Enterprise Secrets Manager Component
 * Single responsibility: Secure secrets management and rotation
 * Follows atomic design principles with clean interfaces
 */

import { ConnectionManager } from '../core/connection-manager';

export interface SecretConfig {
  name: string;
  value?: string;
  description?: string;
  rotationPeriod?: number;
  environment?: string;
  tags?: Record<string, string>;
}

export interface SecretsManagerConfig {
  provider: 'aws' | 'hashicorp-vault' | 'azure-keyvault';
  region?: string;
  vaultUrl?: string;
  encryptionKeyArn?: string;
  rotationEnabled?: boolean;
  auditLogging?: boolean;
}

export class SecretsManager {
  private config: SecretsManagerConfig;
  
  constructor(
    private connectionManager: ConnectionManager,
    config: SecretsManagerConfig
  ) {
    this.config = {
      rotationEnabled: true,
      auditLogging: true,
      ...config
    };
  }

  async storeSecret(secret: SecretConfig): Promise<void> {
    const secretData = {
      name: secret.name,
      value: secret.value || await this.generateSecureValue(),
      description: secret.description,
      tags: {
        environment: secret.environment || 'production',
        managed_by: 'secrets-manager',
        created_at: new Date().toISOString(),
        ...secret.tags
      }
    };

    if (this.config.rotationEnabled && secret.rotationPeriod) {
      secretData.tags.rotation_period = secret.rotationPeriod.toString();
    }

    await this.writeSecret(secretData);
    
    if (this.config.auditLogging) {
      await this.logSecretOperation('store', secret.name, secret.environment);
    }
  }

  async retrieveSecret(secretName: string, environment?: string): Promise<string> {
    const secret = await this.readSecret(secretName, environment);
    
    if (this.config.auditLogging) {
      await this.logSecretOperation('retrieve', secretName, environment);
    }
    
    return secret.value;
  }

  async rotateSecret(secretName: string): Promise<void> {
    const currentSecret = await this.readSecret(secretName);
    const newValue = await this.generateSecureValue();
    
    await this.updateSecretValue(secretName, newValue);
    
    if (this.config.auditLogging) {
      await this.logSecretOperation('rotate', secretName);
    }
    
    // Trigger application secret refresh if needed
    await this.notifySecretRotation(secretName);
  }

  async listSecrets(environment?: string): Promise<SecretConfig[]> {
    const filter = environment ? `environment:${environment}` : '';
    return this.querySecrets(filter);
  }

  async deleteSecret(secretName: string, softDelete: boolean = true): Promise<void> {
    if (softDelete) {
      await this.softDeleteSecret(secretName);
    } else {
      await this.hardDeleteSecret(secretName);
    }
    
    if (this.config.auditLogging) {
      await this.logSecretOperation('delete', secretName);
    }
  }

  async enableRotation(secretName: string, periodDays: number): Promise<void> {
    await this.configureRotation(secretName, periodDays);
    
    if (this.config.auditLogging) {
      await this.logSecretOperation('enable_rotation', secretName);
    }
  }

  async auditSecretAccess(secretName: string, timeRange: { start: Date; end: Date }): Promise<any[]> {
    return this.getSecretAuditLogs(secretName, timeRange);
  }

  // Private helper methods
  private async generateSecureValue(): Promise<string> {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('base64');
  }

  private async writeSecret(secretData: any): Promise<void> {
    // Provider-specific implementation
    switch (this.config.provider) {
      case 'aws':
        await this.writeAWSSecret(secretData);
        break;
      case 'hashicorp-vault':
        await this.writeVaultSecret(secretData);
        break;
      case 'azure-keyvault':
        await this.writeAzureSecret(secretData);
        break;
      default:
        throw new Error(`Unsupported secrets provider: ${this.config.provider}`);
    }
  }

  private async readSecret(secretName: string, environment?: string): Promise<any> {
    switch (this.config.provider) {
      case 'aws':
        return this.readAWSSecret(secretName, environment);
      case 'hashicorp-vault':
        return this.readVaultSecret(secretName, environment);
      case 'azure-keyvault':
        return this.readAzureSecret(secretName, environment);
      default:
        throw new Error(`Unsupported secrets provider: ${this.config.provider}`);
    }
  }

  private async updateSecretValue(secretName: string, newValue: string): Promise<void> {
    switch (this.config.provider) {
      case 'aws':
        await this.updateAWSSecret(secretName, newValue);
        break;
      case 'hashicorp-vault':
        await this.updateVaultSecret(secretName, newValue);
        break;
      case 'azure-keyvault':
        await this.updateAzureSecret(secretName, newValue);
        break;
    }
  }

  // AWS Secrets Manager implementation
  private async writeAWSSecret(secretData: any): Promise<void> {
    const query = `
      INSERT INTO aws_secrets (name, value, description, tags, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (name) DO UPDATE SET
        value = EXCLUDED.value,
        description = EXCLUDED.description,
        tags = EXCLUDED.tags,
        updated_at = NOW()
    `;
    
    await this.connectionManager.executeQuery(query, [
      secretData.name,
      secretData.value,
      secretData.description,
      JSON.stringify(secretData.tags)
    ]);
  }

  private async readAWSSecret(secretName: string, environment?: string): Promise<any> {
    let query = 'SELECT * FROM aws_secrets WHERE name = $1';
    const params = [secretName];
    
    if (environment) {
      query += ' AND tags->>\'environment\' = $2';
      params.push(environment);
    }
    
    const result = await this.connectionManager.executeQuery(query, params);
    
    if (result.rows.length === 0) {
      throw new Error(`Secret not found: ${secretName}`);
    }
    
    return result.rows[0];
  }

  private async updateAWSSecret(secretName: string, newValue: string): Promise<void> {
    const query = `
      UPDATE aws_secrets 
      SET value = $1, updated_at = NOW(), last_rotation = NOW()
      WHERE name = $2
    `;
    
    await this.connectionManager.executeQuery(query, [newValue, secretName]);
  }

  // HashiCorp Vault implementation
  private async writeVaultSecret(secretData: any): Promise<void> {
    const path = `secret/${secretData.name}`;
    const query = `
      INSERT INTO vault_secrets (path, data, metadata, created_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (path) DO UPDATE SET
        data = EXCLUDED.data,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
    `;
    
    await this.connectionManager.executeQuery(query, [
      path,
      JSON.stringify({ value: secretData.value }),
      JSON.stringify({
        description: secretData.description,
        tags: secretData.tags
      })
    ]);
  }

  private async readVaultSecret(secretName: string, environment?: string): Promise<any> {
    let path = `secret/${secretName}`;
    if (environment) {
      path = `secret/${environment}/${secretName}`;
    }
    
    const query = 'SELECT * FROM vault_secrets WHERE path = $1';
    const result = await this.connectionManager.executeQuery(query, [path]);
    
    if (result.rows.length === 0) {
      throw new Error(`Secret not found: ${secretName}`);
    }
    
    const secret = result.rows[0];
    return {
      ...secret,
      value: JSON.parse(secret.data).value
    };
  }

  private async updateVaultSecret(secretName: string, newValue: string): Promise<void> {
    const path = `secret/${secretName}`;
    const query = `
      UPDATE vault_secrets 
      SET data = jsonb_set(data, '{value}', $1::jsonb), updated_at = NOW()
      WHERE path = $2
    `;
    
    await this.connectionManager.executeQuery(query, [JSON.stringify({ value: newValue }), path]);
  }

  // Azure Key Vault implementation
  private async writeAzureSecret(secretData: any): Promise<void> {
    const query = `
      INSERT INTO azure_secrets (name, value, attributes, tags, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (name) DO UPDATE SET
        value = EXCLUDED.value,
        attributes = EXCLUDED.attributes,
        tags = EXCLUDED.tags,
        updated_at = NOW()
    `;
    
    await this.connectionManager.executeQuery(query, [
      secretData.name,
      secretData.value,
      JSON.stringify({ enabled: true }),
      JSON.stringify(secretData.tags)
    ]);
  }

  private async readAzureSecret(secretName: string, environment?: string): Promise<any> {
    let query = 'SELECT * FROM azure_secrets WHERE name = $1 AND attributes->>\'enabled\' = \'true\'';
    const params = [secretName];
    
    if (environment) {
      query += ' AND tags->>\'environment\' = $2';
      params.push(environment);
    }
    
    const result = await this.connectionManager.executeQuery(query, params);
    
    if (result.rows.length === 0) {
      throw new Error(`Secret not found: ${secretName}`);
    }
    
    return result.rows[0];
  }

  private async updateAzureSecret(secretName: string, newValue: string): Promise<void> {
    const query = `
      UPDATE azure_secrets 
      SET value = $1, updated_at = NOW()
      WHERE name = $2
    `;
    
    await this.connectionManager.executeQuery(query, [newValue, secretName]);
  }

  // Audit and logging methods
  private async logSecretOperation(operation: string, secretName: string, environment?: string): Promise<void> {
    const query = `
      INSERT INTO secret_audit_log (operation, secret_name, environment, timestamp, user_context)
      VALUES ($1, $2, $3, NOW(), $4)
    `;
    
    await this.connectionManager.executeQuery(query, [
      operation,
      secretName,
      environment || 'unknown',
      JSON.stringify({
        source: 'secrets-manager',
        timestamp: new Date().toISOString()
      })
    ]);
  }

  private async getSecretAuditLogs(secretName: string, timeRange: { start: Date; end: Date }): Promise<any[]> {
    const query = `
      SELECT * FROM secret_audit_log
      WHERE secret_name = $1
        AND timestamp BETWEEN $2 AND $3
      ORDER BY timestamp DESC
    `;
    
    const result = await this.connectionManager.executeQuery(query, [
      secretName,
      timeRange.start,
      timeRange.end
    ]);
    
    return result.rows;
  }

  // Rotation and notification methods
  private async configureRotation(secretName: string, periodDays: number): Promise<void> {
    const query = `
      INSERT INTO secret_rotation_schedule (secret_name, rotation_period_days, next_rotation, enabled)
      VALUES ($1, $2, NOW() + INTERVAL '1 day' * $2, true)
      ON CONFLICT (secret_name) DO UPDATE SET
        rotation_period_days = EXCLUDED.rotation_period_days,
        next_rotation = NOW() + INTERVAL '1 day' * EXCLUDED.rotation_period_days,
        enabled = true
    `;
    
    await this.connectionManager.executeQuery(query, [secretName, periodDays]);
  }

  private async notifySecretRotation(secretName: string): Promise<void> {
    // Send notification to application services to refresh secrets
    const query = `
      INSERT INTO secret_rotation_notifications (secret_name, notification_sent_at, status)
      VALUES ($1, NOW(), 'pending')
    `;
    
    await this.connectionManager.executeQuery(query, [secretName]);
  }

  private async softDeleteSecret(secretName: string): Promise<void> {
    const query = `
      UPDATE aws_secrets 
      SET deleted_at = NOW(), status = 'soft_deleted'
      WHERE name = $1
    `;
    
    await this.connectionManager.executeQuery(query, [secretName]);
  }

  private async hardDeleteSecret(secretName: string): Promise<void> {
    const query = 'DELETE FROM aws_secrets WHERE name = $1';
    await this.connectionManager.executeQuery(query, [secretName]);
  }

  private async querySecrets(filter: string): Promise<SecretConfig[]> {
    let query = 'SELECT * FROM aws_secrets WHERE deleted_at IS NULL';
    const params: any[] = [];
    
    if (filter) {
      query += ' AND tags::text LIKE $1';
      params.push(`%${filter}%`);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await this.connectionManager.executeQuery(query, params);
    return result.rows;
  }
}
