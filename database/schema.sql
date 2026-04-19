-- Fashion App Production Schema - Neon PostgreSQL 18
-- Advanced features: UUIDv7, Virtual Generated Columns, Enhanced Security

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Enable UUIDv7 support (PostgreSQL 18)
CREATE EXTENSION IF NOT EXISTS "pg_uuidv7";

-- Create custom types for fashion app
CREATE TYPE clothing_category AS ENUM (
    'tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories', 'bags', 'jewelry'
);

CREATE TYPE size_type AS ENUM (
    'xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl', 'custom'
);

CREATE TYPE gender_type AS ENUM (
    'unisex', 'male', 'female', 'non_binary'
);

CREATE TYPE item_condition AS ENUM (
    'new', 'like_new', 'good', 'fair', 'poor'
);

-- Users table with UUIDv7 and advanced features
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuidv7(), -- UUIDv7 for timestamp-ordered IDs
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    username VARCHAR(100) UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    gender gender_type DEFAULT 'unisex',
    birth_date DATE,
    
    -- Virtual generated columns (PostgreSQL 18 - virtual by default)
    display_name VARCHAR(255) GENERATED ALWAYS AS (
        COALESCE(
            NULLIF(full_name, ''), 
            NULLIF(username, ''), 
            'Fashion User'
        )
    ) STORED, -- Stored for better query performance
    
    email_domain VARCHAR(100) GENERATED ALWAYS AS (
        SPLIT_PART(email, '@', 2)
    ),
    
    -- Timestamps with UUIDv7 extraction
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_uuid_timestamp TIMESTAMPTZ GENERATED ALWAYS AS (
        uuid_extract_timestamp(id)
    ),
    
    -- Security fields
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    
    -- Constraints
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_username_check CHECK (username ~* '^[a-zA-Z0-9_]{3,30}$'),
    CONSTRAINT users_age_check CHECK (birth_date IS NULL OR birth_date <= CURRENT_DATE - INTERVAL '13 years')
);

-- Organizations table for B2B features
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    website_url TEXT,
    
    -- Virtual generated columns
    domain_name VARCHAR(100) GENERATED ALWAYS AS (
        CASE 
            WHEN website_url ~* '^https?://([^/]+)' THEN REGEXP_MATCH(website_url, '^https?://([^/]+)')[1]
            ELSE NULL
        END
    ),
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_uuid_timestamp TIMESTAMPTZ GENERATED ALWAYS AS (
        uuid_extract_timestamp(id)
    ),
    
    is_active BOOLEAN DEFAULT true,
    subscription_plan VARCHAR(50) DEFAULT 'free',
    
    CONSTRAINT organizations_slug_check CHECK (slug ~* '^[a-z0-9-]{3,50}$')
);

-- Organization memberships
CREATE TABLE organization_memberships (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    
    -- Temporal constraint without overlaps (PostgreSQL 18)
    membership_period TSTZRANGE NOT NULL DEFAULT tstzrange(CURRENT_TIMESTAMP, 'infinity'),
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    invited_by UUID REFERENCES users(id),
    
    UNIQUE(organization_id, user_id, membership_period WITHOUT OVERLAPS),
    CONSTRAINT organization_memberships_role_check CHECK (role IN ('owner', 'admin', 'member', 'viewer'))
);

-- Fashion items table with advanced features
CREATE TABLE fashion_items (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
    
    -- Basic item information
    title VARCHAR(255) NOT NULL,
    description TEXT,
    brand VARCHAR(100),
    category clothing_category NOT NULL,
    gender gender_type DEFAULT 'unisex',
    
    -- Size and condition
    size size_type,
    color VARCHAR(50),
    material TEXT,
    condition item_condition DEFAULT 'good',
    year_produced INTEGER,
    
    -- Pricing
    price DECIMAL(10,2),
    original_price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Virtual generated columns
    price_discount_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN original_price IS NOT NULL AND original_price > 0 
            THEN ROUND(((original_price - price) / original_price) * 100, 2)
            ELSE NULL
        END
    ),
    
    is_available BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_uuid_timestamp TIMESTAMPTZ GENERATED ALWAYS AS (
        uuid_extract_timestamp(id)
    ),
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Full-text search vector (for better search performance)
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(brand, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(color, '')), 'D')
    ) STORED,
    
    CONSTRAINT fashion_items_price_check CHECK (price >= 0),
    CONSTRAINT fashion_items_original_price_check CHECK (original_price IS NULL OR original_price >= 0),
    CONSTRAINT fashion_items_year_check CHECK (year_produced IS NULL OR year_produced BETWEEN 1900 AND EXTRACT(YEAR FROM CURRENT_DATE) + 2)
);

-- Item images
CREATE TABLE item_images (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    item_id UUID NOT NULL REFERENCES fashion_items(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    is_primary BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    
    -- Cloudflare R2 metadata
    storage_key TEXT UNIQUE NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    width INTEGER,
    height INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_uuid_timestamp TIMESTAMPTZ GENERATED ALWAYS AS (
        uuid_extract_timestamp(id)
    )
);

-- Collections for organizing items
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    
    -- Virtual generated columns
    item_count INTEGER GENERATED ALWAYS AS (
        (SELECT COUNT(*) FROM collection_items WHERE collection_id = collections.id AND is_active = true)
    ),
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_uuid_timestamp TIMESTAMPTZ GENERATED ALWAYS AS (
        uuid_extract_timestamp(id)
    ),
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT collections_name_unique_per_owner UNIQUE(owner_id, name)
);

-- Collection items junction table
CREATE TABLE collection_items (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES fashion_items(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    
    added_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    added_uuid_timestamp TIMESTAMPTZ GENERATED ALWAYS AS (
        uuid_extract_timestamp(id)
    ),
    
    UNIQUE(collection_id, item_id)
);

-- User favorites/likes
CREATE TABLE user_favorites (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES fashion_items(id) ON DELETE CASCADE,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_uuid_timestamp TIMESTAMPTZ GENERATED ALWAYS AS (
        uuid_extract_timestamp(id)
    ),
    
    UNIQUE(user_id, item_id)
);

-- User activity tracking (for analytics)
CREATE TABLE user_activities (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    
    -- JSONB for flexible activity data
    activity_data JSONB,
    
    -- IP tracking for security
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_uuid_timestamp TIMESTAMPTZ GENERATED ALWAYS AS (
        uuid_extract_timestamp(id)
    ),
    
    CONSTRAINT user_activities_type_check CHECK (activity_type IN ('view', 'like', 'share', 'save', 'purchase', 'login', 'signup'))
);

-- API keys for machine authentication
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE, -- Hashed API key
    key_prefix VARCHAR(20) NOT NULL, -- First few characters for identification
    
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
    
    permissions JSONB NOT NULL DEFAULT '{"read": true}',
    is_active BOOLEAN DEFAULT true,
    
    -- Usage tracking
    last_used_at TIMESTAMPTZ,
    usage_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_uuid_timestamp TIMESTAMPTZ GENERATED ALWAYS AS (
        uuid_extract_timestamp(id)
    ),
    expires_at TIMESTAMPTZ,
    
    CONSTRAINT api_keys_name_unique_per_owner UNIQUE(owner_id, name)
);

-- Advanced indexes for performance
-- B-tree indexes with skip scan support (PostgreSQL 18)
CREATE INDEX idx_fashion_items_category_price ON fashion_items(category, price);
CREATE INDEX idx_fashion_items_owner_created ON fashion_items(owner_id, created_at DESC);
CREATE INDEX idx_fashion_items_available_category ON fashion_items(is_available, category) WHERE is_available = true;

-- GIN indexes for full-text search
CREATE INDEX idx_fashion_items_search ON fashion_items USING GIN(search_vector);
CREATE INDEX idx_fashion_items_json ON fashion_items USING GIN(activity_data);

-- Partial indexes for better performance
CREATE INDEX idx_fashion_items_featured ON fashion_items(created_at DESC) WHERE is_featured = true;
CREATE INDEX idx_fashion_items_available ON fashion_items(created_at DESC) WHERE is_available = true;

-- UUIDv7 indexes benefit from natural ordering
CREATE INDEX idx_users_created_uuid_timestamp ON users(created_uuid_timestamp);
CREATE INDEX idx_fashion_items_created_uuid_timestamp ON fashion_items(created_uuid_timestamp);

-- Composite indexes for common queries
CREATE INDEX idx_collection_items_collection_sort ON collection_items(collection_id, sort_order) WHERE is_active = true;
CREATE INDEX idx_user_favorites_user_created ON user_favorites(user_id, created_at DESC);

-- Security and audit triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_fashion_items_updated_at 
    BEFORE UPDATE ON fashion_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at 
    BEFORE UPDATE ON collections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit trigger for user activities
CREATE OR REPLACE FUNCTION log_user_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO user_activities (user_id, activity_type, activity_data)
        VALUES (NEW.id, 'signup', json_build_object('email', NEW.email));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.last_login_at IS DISTINCT FROM NEW.last_login_at THEN
            INSERT INTO user_activities (user_id, activity_type, activity_data)
            VALUES (NEW.id, 'login', json_build_object('login_count', NEW.login_count));
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER user_activity_trigger
    AFTER INSERT OR UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION log_user_activity();

-- Views for common queries
CREATE VIEW active_fashion_items AS
SELECT 
    fi.*,
    u.display_name as owner_name,
    u.avatar_url as owner_avatar,
    COALESCE(
        (SELECT json_agg(image_url ORDER BY sort_order) 
         FROM item_images ii 
         WHERE ii.item_id = fi.id AND ii.is_primary = false),
        '[]'::json
    ) as additional_images,
    (SELECT image_url FROM item_images ii WHERE ii.item_id = fi.id AND ii.is_primary = true LIMIT 1) as primary_image
FROM fashion_items fi
JOIN users u ON fi.owner_id = u.id
WHERE fi.is_available = true;

CREATE VIEW user_stats AS
SELECT 
    u.id,
    u.display_name,
    COUNT(DISTINCT fi.id) as item_count,
    COUNT(DISTINCT uf.id) as favorite_count,
    COUNT(DISTINCT c.id) as collection_count,
    COALESCE(SUM(fi.price), 0) as total_item_value
FROM users u
LEFT JOIN fashion_items fi ON u.id = fi.owner_id AND fi.is_available = true
LEFT JOIN user_favorites uf ON u.id = uf.user_id
LEFT JOIN collections c ON u.id = c.owner_id
GROUP BY u.id, u.display_name;

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE fashion_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY users_own_profile ON users FOR ALL USING (id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY items_owner_access ON fashion_items FOR ALL USING (
    owner_id = current_setting('app.current_user_id', true)::uuid OR
    (organization_id IN (
        SELECT organization_id FROM organization_memberships 
        WHERE user_id = current_setting('app.current_user_id', true)::uuid 
        AND membership_period @> CURRENT_TIMESTAMP
    ))
);

CREATE POLICY collections_owner_access ON collections FOR ALL USING (
    owner_id = current_setting('app.current_user_id', true)::uuid OR
    (is_public = true)
);

CREATE POLICY favorites_user_access ON user_favorites FOR ALL USING (
    user_id = current_setting('app.current_user_id', true)::uuid
);

-- Performance monitoring setup
ALTER SYSTEM SET pg_stat_statements.track = 'all';
ALTER SYSTEM SET pg_stat_statements.max = 10000;
ALTER SYSTEM SET pg_stat_statements.track_utility = 'off';

-- Enable enhanced monitoring (PostgreSQL 18)
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log slow queries
ALTER SYSTEM SET log_checkpoints = 'on';
ALTER SYSTEM SET log_connections = 'on';
ALTER SYSTEM SET log_disconnections = 'on';

-- Configure connection pooling settings
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';

-- Asynchronous I/O settings (PostgreSQL 18)
ALTER SYSTEM SET io_method = 'worker'; -- Enable async I/O
ALTER SYSTEM SET io_workers = 4; -- Number of I/O worker processes

-- Enhanced I/O monitoring (PostgreSQL 18)
ALTER SYSTEM SET track_io_timing = 'on'; -- Enable I/O timing
ALTER SYSTEM SET track_wal_io_timing = 'on'; -- Enable WAL I/O timing

-- Security improvements (PostgreSQL 18)
ALTER SYSTEM SET ssl_tls13_ciphers = 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256';
ALTER SYSTEM SET ssl_min_protocol_version = 'TLSv1.2';
ALTER SYSTEM SET ssl_max_protocol_version = 'TLSv1.3';

-- Autovacuum improvements (PostgreSQL 18)
ALTER SYSTEM SET autovacuum_vacuum_cost_delay = '10ms';
ALTER SYSTEM SET autovacuum_vacuum_cost_limit = 200;
ALTER SYSTEM SET autovacuum_max_workers = 3; -- Dynamic worker management
ALTER SYSTEM SET autovacuum_naptime = '15s';

-- Enhanced RETURNING clause support (PostgreSQL 18)
-- This is a query-level feature, no configuration needed

-- OAuth authentication setup (PostgreSQL 18)
-- This requires external configuration, but we prepare the framework
ALTER SYSTEM SET oauth_validator_libraries = 'oauth_validator';

-- PostgreSQL 18 Enhanced Functions and Views

-- Array function demonstrations (PostgreSQL 18)
CREATE OR REPLACE FUNCTION get_sorted_categories()
RETURNS TEXT[] AS $$
BEGIN
  RETURN array_sort(ARRAY['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories']);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_reversed_size_order()
RETURNS TEXT[] AS $$
BEGIN
  RETURN array_reverse(ARRAY['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl']);
END;
$$ LANGUAGE plpgsql;

-- Enhanced audit triggers using PostgreSQL 18 RETURNING clause
CREATE OR REPLACE FUNCTION enhanced_audit_trigger_function()
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
    ) RETURNING id, old.table_name as affected_table, OLD.id as record_id;
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
    ) RETURNING id, 
               old.table_name as affected_table, 
               OLD.id as record_id,
               NEW.id as new_record_id,
               CASE WHEN OLD.updated_at IS DISTINCT FROM NEW.updated_at THEN 'timestamp_updated' ELSE 'data_updated' END as change_type;
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
    ) RETURNING id, new.table_name as affected_table, NEW.id as record_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced monitoring views using PostgreSQL 18 pg_stat_io
CREATE OR REPLACE VIEW enhanced_database_stats AS
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_live_tup as live_tuples,
  n_dead_tup as dead_tuples,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze,
  -- PostgreSQL 18 I/O statistics
  COALESCE(io_stats.read_bytes, 0) as bytes_read,
  COALESCE(io_stats.write_bytes, 0) as bytes_written,
  COALESCE(io_stats.extend_bytes, 0) as bytes_extended,
  -- Performance metrics
  ROUND((n_tup_ins + n_tup_upd + n_tup_del)::NUMERIC / 
        GREATEST(EXTRACT(EPOCH FROM (COALESCE(last_vacuum, last_autovacuum, CURRENT_TIMESTAMP) - 
        COALESCE(last_analyze, last_autoanalyze, CURRENT_TIMESTAMP))), 1)::NUMERIC, 2) as ops_per_second
FROM pg_stat_user_tables t
LEFT JOIN (
  SELECT 
    schemaname,
    tablename,
    SUM(read_bytes) as read_bytes,
    SUM(write_bytes) as write_bytes,
    SUM(extend_bytes) as extend_bytes
  FROM pg_stat_io 
  WHERE object = 'relation'
  GROUP BY schemaname, tablename
) io_stats ON t.schemaname = io_stats.schemaname AND t.relname = io_stats.tablename
ORDER BY t.schemaname, t.relname;

-- Per-backend I/O monitoring view (PostgreSQL 18)
CREATE OR REPLACE VIEW backend_io_activity AS
SELECT 
  pid,
  usename,
  application_name,
  client_addr,
  state,
  query_start,
  -- Backend I/O stats
  backend_io.read_bytes,
  backend_io.write_bytes,
  backend_io.reads,
  backend_io.writes,
  -- Backend WAL stats
  backend_wal.wal_write_bytes,
  backend_wal.wal_writes,
  backend_wal.wal_sync_bytes,
  backend_wal.wal_syncs,
  -- Performance indicators
  EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - query_start)) as query_duration_seconds
FROM pg_stat_activity a
LEFT JOIN pg_stat_get_backend_io(a.pid) backend_io ON true
LEFT JOIN pg_stat_get_backend_wal(a.pid) backend_wal ON true
WHERE a.state != 'idle'
ORDER BY query_start;

-- OAuth authentication helper functions (PostgreSQL 18)
CREATE OR REPLACE FUNCTION validate_oauth_token(token TEXT)
RETURNS TABLE(username TEXT, roles TEXT[], is_valid BOOLEAN) AS $$
BEGIN
  -- This would integrate with your OAuth provider
  -- For now, return placeholder validation
  RETURN QUERY 
  SELECT 
    split_part(token, '.', 1) as username,
    ARRAY['user', 'read_access'] as roles,
    length(token) > 20 as is_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Array aggregation examples for fashion app analytics
CREATE OR REPLACE FUNCTION get_category_popularity()
RETURNS TABLE(category TEXT, item_count BIGINT, avg_price DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    category,
    COUNT(*) as item_count,
    AVG(price) as avg_price
  FROM fashion_items 
  WHERE is_available = true
  GROUP BY category
  ORDER BY item_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Bytea handling for image metadata (PostgreSQL 18)
CREATE OR REPLACE FUNCTION process_image_metadata(image_data BYTEA)
RETURNS TABLE(file_size BIGINT, mime_type TEXT, is_processed BOOLEAN) AS $$
BEGIN
  -- PostgreSQL 18 bytea improvements
  RETURN QUERY
  SELECT 
    octet_length(image_data) as file_size,
    CASE 
      WHEN get_byte(image_data, 0) = 255 AND get_byte(image_data, 1) = 216 THEN 'image/jpeg'
      WHEN get_byte(image_data, 0) = 137 AND get_byte(image_data, 1) = 80 THEN 'image/png'
      WHEN get_byte(image_data, 0) = 71 AND get_byte(image_data, 1) = 73 THEN 'image/gif'
      ELSE 'application/octet-stream'
    END as mime_type,
    octet_length(image_data) > 0 as is_processed;
END;
$$ LANGUAGE plpgsql;

-- Enhanced constraint with NOT NULL NOT VALID (PostgreSQL 18)
ALTER TABLE fashion_items 
ADD CONSTRAINT fashion_items_price_positive 
CHECK (price >= 0) NOT VALID;

-- Apply the constraint without full table scan (faster for large tables)
ALTER TABLE fashion_items VALIDATE CONSTRAINT fashion_items_price_positive;

-- Enhanced security view for OAuth users
CREATE OR REPLACE VIEW oauth_user_profile AS
SELECT 
  u.id,
  u.display_name,
  u.email,
  u.created_at,
  -- OAuth-specific fields
  COALESCE(u.oauth_provider, 'email') as auth_method,
  u.oauth_subject_id,
  -- Usage statistics
  COUNT(DISTINCT fi.id) as item_count,
  COUNT(DISTINCT uf.id) as favorite_count
FROM users u
LEFT JOIN fashion_items fi ON u.id = fi.owner_id
LEFT JOIN user_favorites uf ON u.id = uf.user_id
WHERE u.is_active = true
GROUP BY u.id, u.display_name, u.email, u.created_at, u.oauth_provider, u.oauth_subject_id;

-- Add OAuth fields to users table
ALTER TABLE users 
ADD COLUMN oauth_provider VARCHAR(50),
ADD COLUMN oauth_subject_id VARCHAR(255),
ADD COLUMN oauth_last_verified TIMESTAMPTZ;

-- Enhanced virtual generated columns using PostgreSQL 18 array functions
ALTER TABLE fashion_items 
ADD COLUMN tag_array TEXT[] GENERATED ALWAYS AS (
  array_sort(ARRAY[category, gender, COALESCE(color, 'uncolored')])
) STORED;

-- Performance optimization indexes for PostgreSQL 18 features
CREATE INDEX idx_fashion_items_tag_array ON fashion_items USING GIN(tag_array);
CREATE INDEX idx_users_oauth_subject ON users(oauth_provider, oauth_subject_id) WHERE oauth_provider IS NOT NULL;

-- Enhanced monitoring for logical replication (PostgreSQL 18)
CREATE OR REPLACE VIEW replication_health AS
SELECT 
  subname,
  slot_name,
  sync_state,
  COUNT(*) FILTER (WHERE sync_state = 'ready') as ready_tables,
  COUNT(*) FILTER (WHERE sync_state = 'syncing') as syncing_tables,
  COUNT(*) FILTER (WHERE sync_state = 'error') as error_tables,
  MAX(sync_status_time) as last_sync_time
FROM pg_subscription_rel
GROUP BY subname, slot_name, sync_state
ORDER BY subname, slot_name;

-- Comment summary
COMMENT ON SCHEMA public IS 'Fashion App Production Schema with PostgreSQL 18 Advanced Features';
COMMENT ON TABLE users IS 'User accounts with UUIDv7, virtual generated columns, and OAuth support';
COMMENT ON TABLE fashion_items IS 'Fashion items with full-text search, advanced indexing, and PostgreSQL 18 array functions';
COMMENT ON TABLE organizations IS 'B2B organization support with temporal constraints and enhanced security';
COMMENT ON TABLE api_keys IS 'Machine authentication with usage tracking and enhanced monitoring';
COMMENT ON VIEW enhanced_database_stats IS 'PostgreSQL 18 enhanced database statistics with I/O monitoring';
COMMENT ON VIEW backend_io_activity IS 'PostgreSQL 18 per-backend I/O and WAL activity monitoring';
COMMENT ON VIEW oauth_user_profile IS 'OAuth user profile with analytics and usage statistics';
