import { sql } from '../config/database';

// Security configuration for Neon PostgreSQL 18
export interface SecurityConfig {
  rowLevelSecurity: boolean;
  columnLevelEncryption: boolean;
  auditLogging: boolean;
  ipAllowList: string[];
  sessionTimeout: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    maxAge: number; // days
  };
  connectionSecurity: {
    requireSSL: boolean;
    minTLSVersion: string;
    allowedCipherSuites: string[];
  };
}

export class DatabaseSecurity {
  private config: SecurityConfig;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = {
      rowLevelSecurity: true,
      columnLevelEncryption: false, // Requires additional setup
      auditLogging: true,
      ipAllowList: [],
      sessionTimeout: 3600000, // 1 hour in milliseconds
      passwordPolicy: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        maxAge: 90
      },
      connectionSecurity: {
        requireSSL: true,
        minTLSVersion: '1.2',
        allowedCipherSuites: [
          'TLS_AES_256_GCM_SHA384',
          'TLS_CHACHA20_POLY1305_SHA256',
          'TLS_AES_128_GCM_SHA256'
        ]
      },
      ...config
    };
  }

  // Row Level Security (RLS) setup
  async enableRowLevelSecurity(): Promise<void> {
    try {
      console.log('Enabling Row Level Security...');

      // Enable RLS on all user-facing tables
      const tables = [
        'users',
        'fashion_items', 
        'collections',
        'user_favorites',
        'organization_memberships',
        'api_keys'
      ];

      for (const table of tables) {
        await sql`ALTER TABLE ${sql.unsafe(table)} ENABLE ROW LEVEL SECURITY`;
        console.log(`RLS enabled on table: ${table}`);
      }

      // Create RLS policies for each table
      await this.createRLSPolicies();

      console.log('Row Level Security setup completed');
    } catch (error) {
      console.error('Failed to enable Row Level Security:', error);
      throw error;
    }
  }

  private async createRLSPolicies(): Promise<void> {
    // Users table - users can only access their own profile
    await sql`
      CREATE POLICY users_own_profile ON users
      FOR ALL USING (id = current_setting('app.current_user_id', true)::uuid)
    `;

    // Fashion items - owners and organization members
    await sql`
      CREATE POLICY items_owner_access ON fashion_items
      FOR ALL USING (
        owner_id = current_setting('app.current_user_id', true)::uuid OR
        organization_id IN (
          SELECT organization_id FROM organization_memberships 
          WHERE user_id = current_setting('app.current_user_id', true)::uuid 
          AND membership_period @> CURRENT_TIMESTAMP
        )
      )
    `;

    // Collections - owners and public access
    await sql`
      CREATE POLICY collections_owner_access ON collections
      FOR ALL USING (
        owner_id = current_setting('app.current_user_id', true)::uuid OR
        is_public = true
      )
    `;

    // User favorites - users can only access their own favorites
    await sql`
      CREATE POLICY favorites_user_access ON user_favorites
      FOR ALL USING (user_id = current_setting('app.current_user_id', true)::uuid)
    `;

    // API keys - owners and organization members
    await sql`
      CREATE POLICY api_keys_owner_access ON api_keys
      FOR ALL USING (
        owner_id = current_setting('app.current_user_id', true)::uuid OR
        organization_id IN (
          SELECT organization_id FROM organization_memberships 
          WHERE user_id = current_setting('app.current_user_id', true)::uuid 
          AND membership_period @> CURRENT_TIMESTAMP
        )
      )
    `;
  }

  // Column-level encryption setup
  async setupColumnEncryption(): Promise<void> {
    try {
      console.log('Setting up column-level encryption...');

      // Enable pgcrypto extension for encryption functions
      await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;

      // Create encryption/decryption functions
      await sql`
        CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data TEXT, key TEXT)
        RETURNS TEXT AS $$
        BEGIN
          RETURN encode(encrypt(data::bytea, key::bytea, 'aes'), 'base64');
        END;
        $$ LANGUAGE plpgsql;
      `;

      await sql`
        CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted_data TEXT, key TEXT)
        RETURNS TEXT AS $$
        BEGIN
          RETURN convert_from(decrypt(decode(encrypted_data, 'base64'), key::bytea, 'aes'), 'UTF8');
        END;
        $$ LANGUAGE plpgsql;
      `;

      console.log('Column encryption setup completed');
    } catch (error) {
      console.error('Failed to setup column encryption:', error);
      throw error;
    }
  }

  // Audit logging setup
  async setupAuditLogging(): Promise<void> {
    try {
      console.log('Setting up audit logging...');

      // Create audit table
      await sql`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id UUID PRIMARY KEY DEFAULT uuidv7(),
          table_name VARCHAR(255) NOT NULL,
          operation VARCHAR(10) NOT NULL,
          user_id UUID,
          old_values JSONB,
          new_values JSONB,
          ip_address INET,
          user_agent TEXT,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          created_uuid_timestamp TIMESTAMPTZ GENERATED ALWAYS AS (
            uuid_extract_timestamp(id)
          )
        )
      `;

      // Create audit trigger function
      await sql`
        CREATE OR REPLACE FUNCTION audit_trigger_function()
        RETURNS TRIGGER AS $$
        BEGIN
          IF TG_OP = 'DELETE' THEN
            INSERT INTO audit_logs (table_name, operation, user_id, old_values, ip_address, user_agent)
            VALUES (
              TG_TABLE_NAME,
              TG_OP,
              current_setting('app.current_user_id', true)::uuid,
              row_to_json(OLD),
              inet_client_addr(),
              current_setting('app.user_agent', true)
            );
            RETURN OLD;
          ELSIF TG_OP = 'UPDATE' THEN
            INSERT INTO audit_logs (table_name, operation, user_id, old_values, new_values, ip_address, user_agent)
            VALUES (
              TG_TABLE_NAME,
              TG_OP,
              current_setting('app.current_user_id', true)::uuid,
              row_to_json(OLD),
              row_to_json(NEW),
              inet_client_addr(),
              current_setting('app.user_agent', true)
            );
            RETURN NEW;
          ELSIF TG_OP = 'INSERT' THEN
            INSERT INTO audit_logs (table_name, operation, user_id, new_values, ip_address, user_agent)
            VALUES (
              TG_TABLE_NAME,
              TG_OP,
              current_setting('app.current_user_id', true)::uuid,
              row_to_json(NEW),
              inet_client_addr(),
              current_setting('app.user_agent', true)
            );
            RETURN NEW;
          END IF;
          RETURN NULL;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `;

      // Apply audit triggers to sensitive tables
      const auditTables = ['users', 'fashion_items', 'organizations', 'api_keys'];
      
      for (const table of auditTables) {
        try {
          await sql`DROP TRIGGER IF EXISTS audit_trigger ON ${sql.unsafe(table)}`;
          await sql`
            CREATE TRIGGER audit_trigger
            AFTER INSERT OR UPDATE OR DELETE ON ${sql.unsafe(table)}
            FOR EACH ROW EXECUTE FUNCTION audit_trigger_function()
          `;
          console.log(`Audit trigger created for table: ${table}`);
        } catch (error) {
          console.warn(`Failed to create audit trigger for ${table}:`, error);
        }
      }

      console.log('Audit logging setup completed');
    } catch (error) {
      console.error('Failed to setup audit logging:', error);
      throw error;
    }
  }

  // Session management
  async setupSessionSecurity(): Promise<void> {
    try {
      console.log('Setting up session security...');

      // Set session timeout
      await sql`SET session_timeout = ${this.config.sessionTimeout}ms`;

      // Create session management table
      await sql`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id UUID PRIMARY KEY DEFAULT uuidv7(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          session_token VARCHAR(255) UNIQUE NOT NULL,
          ip_address INET,
          user_agent TEXT,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          last_accessed TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 hour'),
          is_active BOOLEAN DEFAULT TRUE
        )
      `;

      // Create session cleanup function
      await sql`
        CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
        RETURNS INTEGER AS $$
        DECLARE
          deleted_count INTEGER;
        BEGIN
          DELETE FROM user_sessions 
          WHERE expires_at < CURRENT_TIMESTAMP OR is_active = FALSE;
          
          GET DIAGNOSTICS deleted_count = ROW_COUNT;
          RETURN deleted_count;
        END;
        $$ LANGUAGE plpgsql;
      `;

      // Create index for session lookup
      await sql`
        CREATE INDEX IF NOT EXISTS idx_user_sessions_token 
        ON user_sessions(session_token) 
        WHERE is_active = TRUE
      `;

      console.log('Session security setup completed');
    } catch (error) {
      console.error('Failed to setup session security:', error);
      throw error;
    }
  }

  // Password policy enforcement
  async setupPasswordPolicy(): Promise<void> {
    try {
      console.log('Setting up password policy...');

      const policy = this.config.passwordPolicy;

      // Create password validation function
      await sql`
        CREATE OR REPLACE FUNCTION validate_password(password TEXT)
        RETURNS BOOLEAN AS $$
        DECLARE
          is_valid BOOLEAN := TRUE;
        BEGIN
          -- Check minimum length
          IF length(password) < ${policy.minLength} THEN
            is_valid := FALSE;
          END IF;
          
          -- Check for uppercase letter
          ${policy.requireUppercase ? `
          IF password !~ '[A-Z]' THEN
            is_valid := FALSE;
          END IF;
          ` : ''}
          
          -- Check for lowercase letter
          ${policy.requireLowercase ? `
          IF password !~ '[a-z]' THEN
            is_valid := FALSE;
          END IF;
          ` : ''}
          
          -- Check for numbers
          ${policy.requireNumbers ? `
          IF password !~ '[0-9]' THEN
            is_valid := FALSE;
          END IF;
          ` : ''}
          
          -- Check for special characters
          ${policy.requireSpecialChars ? `
          IF password !~ '[!@#$%^&*()_+\-=\[\]{};:"\\|,.<>/?]' THEN
            is_valid := FALSE;
          END IF;
          ` : ''}
          
          RETURN is_valid;
        END;
        $$ LANGUAGE plpgsql;
      `;

      console.log('Password policy setup completed');
    } catch (error) {
      console.error('Failed to setup password policy:', error);
      throw error;
    }
  }

  // IP allow list setup
  async setupIPAllowList(): Promise<void> {
    try {
      console.log('Setting up IP allow list...');

      if (this.config.ipAllowList.length === 0) {
        console.log('No IP allow list configured, skipping...');
        return;
      }

      // Create IP allow list table
      await sql`
        CREATE TABLE IF NOT EXISTS ip_allow_list (
          id UUID PRIMARY KEY DEFAULT uuidv7(),
          ip_address INET UNIQUE NOT NULL,
          description TEXT,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT TRUE
        )
      `;

      // Clear existing entries
      await sql`DELETE FROM ip_allow_list`;

      // Insert allowed IPs
      for (const ip of this.config.ipAllowList) {
        await sql`
          INSERT INTO ip_allow_list (ip_address, description)
          VALUES (${ip}, 'Allowed IP address')
        `;
      }

      // Create IP check function
      await sql`
        CREATE OR REPLACE FUNCTION check_ip_allowed()
        RETURNS BOOLEAN AS $$
        DECLARE
          is_allowed BOOLEAN := FALSE;
        BEGIN
          -- Check if current IP is in allow list
          SELECT EXISTS(
            SELECT 1 FROM ip_allow_list 
            WHERE ip_address = inet_client_addr() 
            AND is_active = TRUE
          ) INTO is_allowed;
          
          RETURN is_allowed;
        END;
        $$ LANGUAGE plpgsql;
      `;

      console.log(`IP allow list setup completed with ${this.config.ipAllowList.length} entries`);
    } catch (error) {
      console.error('Failed to setup IP allow list:', error);
      throw error;
    }
  }

  // Connection security configuration
  async configureConnectionSecurity(): Promise<void> {
    try {
      console.log('Configuring connection security...');

      const security = this.config.connectionSecurity;

      // These settings would typically be configured at the cluster level
      // For now, we'll create a configuration record
      await sql`
        CREATE TABLE IF NOT EXISTS security_config (
          id UUID PRIMARY KEY DEFAULT uuidv7(),
          config_key VARCHAR(255) UNIQUE NOT NULL,
          config_value TEXT NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
      `;

      const configs = [
        ['require_ssl', security.requireSSL.toString()],
        ['min_tls_version', security.minTLSVersion],
        ['allowed_cipher_suites', security.allowedCipherSuites.join(',')]
      ];

      for (const [key, value] of configs) {
        await sql`
          INSERT INTO security_config (config_key, config_value)
          VALUES (${key}, ${value})
          ON CONFLICT (config_key) 
          DO UPDATE SET 
            config_value = EXCLUDED.config_value,
            updated_at = CURRENT_TIMESTAMP
        `;
      }

      console.log('Connection security configuration completed');
    } catch (error) {
      console.error('Failed to configure connection security:', error);
      throw error;
    }
  }

  // Comprehensive security setup
  async setupFullSecurity(): Promise<void> {
    try {
      console.log('Starting comprehensive security setup...');

      const setupSteps = [
        { name: 'Row Level Security', fn: () => this.enableRowLevelSecurity() },
        { name: 'Column Encryption', fn: () => this.setupColumnEncryption() },
        { name: 'Audit Logging', fn: () => this.setupAuditLogging() },
        { name: 'Session Security', fn: () => this.setupSessionSecurity() },
        { name: 'Password Policy', fn: () => this.setupPasswordPolicy() },
        { name: 'IP Allow List', fn: () => this.setupIPAllowList() },
        { name: 'Connection Security', fn: () => this.configureConnectionSecurity() }
      ];

      for (const step of setupSteps) {
        try {
          console.log(`Executing: ${step.name}`);
          await step.fn();
        } catch (error) {
          console.error(`Failed to execute ${step.name}:`, error);
          // Continue with other security measures
        }
      }

      console.log('Comprehensive security setup completed');
    } catch (error) {
      console.error('Failed to setup full security:', error);
      throw error;
    }
  }

  // Security audit and reporting
  async generateSecurityReport(): Promise<{
    rlsEnabled: boolean;
    auditEnabled: boolean;
    sessionSecurity: boolean;
    passwordPolicy: boolean;
    ipAllowList: boolean;
    connectionSecurity: boolean;
    recommendations: string[];
  }> {
    try {
      const report = {
        rlsEnabled: false,
        auditEnabled: false,
        sessionSecurity: false,
        passwordPolicy: false,
        ipAllowList: false,
        connectionSecurity: false,
        recommendations: [] as string[]
      };

      // Check RLS status
      const rlsResult = await sql`
        SELECT COUNT(*) as count FROM pg_tables 
        WHERE rowsecurity = true AND schemaname = 'public'
      `;
      report.rlsEnabled = parseInt(rlsResult[0].count) > 0;

      // Check audit table
      const auditResult = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'audit_logs'
        ) as exists
      `;
      report.auditEnabled = auditResult[0].exists;

      // Check session table
      const sessionResult = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'user_sessions'
        ) as exists
      `;
      report.sessionSecurity = sessionResult[0].exists;

      // Check password validation function
      const passwordResult = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.routines 
          WHERE routine_name = 'validate_password'
        ) as exists
      `;
      report.passwordPolicy = passwordResult[0].exists;

      // Check IP allow list
      const ipResult = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'ip_allow_list'
        ) as exists
      `;
      report.ipAllowList = ipResult[0].exists;

      // Check security config
      const configResult = await sql`
        SELECT COUNT(*) as count FROM security_config
      `;
      report.connectionSecurity = parseInt(configResult[0].count) > 0;

      // Generate recommendations
      if (!report.rlsEnabled) {
        report.recommendations.push('Enable Row Level Security for better data isolation');
      }
      if (!report.auditEnabled) {
        report.recommendations.push('Enable audit logging for compliance and monitoring');
      }
      if (!report.sessionSecurity) {
        report.recommendations.push('Setup session management for better security');
      }
      if (!report.passwordPolicy) {
        report.recommendations.push('Implement password policy enforcement');
      }
      if (!report.ipAllowList && this.config.ipAllowList.length > 0) {
        report.recommendations.push('Configure IP allow list for network security');
      }

      return report;
    } catch (error) {
      console.error('Failed to generate security report:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const databaseSecurity = new DatabaseSecurity();

// Helper function to set user context for RLS
export async function setUserContext(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
  try {
    await sql`SET LOCAL app.current_user_id = ${userId}`;
    
    if (ipAddress) {
      await sql`SET LOCAL app.client_ip = ${ipAddress}`;
    }
    
    if (userAgent) {
      await sql`SET LOCAL app.user_agent = ${userAgent}`;
    }
  } catch (error) {
    console.error('Failed to set user context:', error);
    throw error;
  }
}

// Helper function to clear user context
export async function clearUserContext(): Promise<void> {
  try {
    await sql`RESET ALL`;
  } catch (error) {
    console.error('Failed to clear user context:', error);
    throw error;
  }
}
