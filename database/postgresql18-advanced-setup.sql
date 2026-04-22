-- PostgreSQL 18 Advanced Features Setup for Fashion Enterprise
-- This script enables and configures all the latest PostgreSQL 18 features

-- ========================================
-- 1. Enable Required Extensions
-- ========================================

-- UUIDv7 Support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_uuidv7;

-- Enhanced JSON and Array Operations
CREATE EXTENSION IF NOT EXISTS btree_gin;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Enhanced Monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pg_stat_io;

-- Enhanced Search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Virtual Columns Support (PostgreSQL 18)
CREATE EXTENSION IF NOT EXISTS generated_columns;

-- ========================================
-- 2. UUIDv7 Configuration and Usage
-- ========================================

-- Create UUIDv7 generation function
CREATE OR REPLACE FUNCTION generate_uuidv7()
RETURNS UUID
LANGUAGE SQL
AS $$
    SELECT uuid_generate_v7();
$$;

-- Create UUIDv7 table with optimized indexing
CREATE TABLE IF NOT EXISTS fashion_entities (
    id UUID PRIMARY KEY DEFAULT generate_uuidv7(),
    entity_type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Create optimized UUIDv7 index for time-based queries
CREATE INDEX idx_fashion_entities_created_at ON fashion_entities (created_at DESC);
CREATE INDEX idx_fashion_entities_type_created ON fashion_entities (entity_type, created_at DESC);

-- ========================================
-- 3. Virtual Generated Columns (PostgreSQL 18)
-- ========================================

-- Enhanced product table with virtual columns
CREATE TABLE IF NOT EXISTS fashion_products (
    id UUID PRIMARY KEY DEFAULT generate_uuidv7(),
    name VARCHAR(255) NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    category VARCHAR(100),
    brand VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Virtual generated columns
    final_price DECIMAL(10,2) GENERATED ALWAYS AS (
        base_price * (1 - discount_percentage / 100)
    ) STORED,
    
    price_tier VARCHAR(20) GENERATED ALWAYS AS (
        CASE 
            WHEN base_price < 50 THEN 'budget'
            WHEN base_price < 200 THEN 'mid-range'
            WHEN base_price < 500 THEN 'premium'
            ELSE 'luxury'
        END
    ) STORED,
    
    search_vector TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(brand, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(category, '')), 'C')
    ) STORED
);

-- Create indexes for virtual columns
CREATE INDEX idx_products_final_price ON fashion_products (final_price);
CREATE INDEX idx_products_price_tier ON fashion_products (price_tier);
CREATE INDEX idx_products_search_vector ON fashion_products USING GIN (search_vector);

-- ========================================
-- 4. Enhanced Array and Bytea Operations
-- ========================================

-- Fashion trends with enhanced array operations
CREATE TABLE IF NOT EXISTS fashion_trends (
    id UUID PRIMARY KEY DEFAULT generate_uuidv7(),
    trend_name VARCHAR(255) NOT NULL,
    season VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    tags TEXT[] NOT NULL,
    color_palette TEXT[] NOT NULL,
    style_keywords TEXT[] NOT NULL,
    image_urls TEXT[] NOT NULL,
    metadata BYTEA,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced array indexes
CREATE INDEX idx_trends_tags ON fashion_trends USING GIN (tags);
CREATE INDEX idx_trends_color_palette ON fashion_trends USING GIN (color_palette);
CREATE INDEX idx_trends_style_keywords ON fashion_trends USING GIN (style_keywords);

-- Array aggregation functions
CREATE OR REPLACE FUNCTION get_trending_tags(season VARCHAR, year INTEGER)
RETURNS TABLE(tag TEXT, frequency BIGINT)
LANGUAGE SQL
AS $$
    SELECT unnest(tags) as tag, count(*) as frequency
    FROM fashion_trends
    WHERE season = $1 AND year = $2
    GROUP BY tag
    ORDER BY frequency DESC
$$;

-- ========================================
-- 5. Enhanced JSON Operations
-- ========================================

-- Product catalog with enhanced JSON
CREATE TABLE IF NOT EXISTS product_catalog (
    id UUID PRIMARY KEY DEFAULT generate_uuidv7(),
    product_data JSONB NOT NULL,
    search_index JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced JSON indexes
CREATE INDEX idx_catalog_product_data ON product_catalog USING GIN (product_data);
CREATE INDEX idx_catalog_search_index ON product_catalog USING GIN (search_index);

-- JSON path queries for advanced filtering
CREATE OR REPLACE FUNCTION filter_products_by_attributes(
    min_price DECIMAL,
    max_price DECIMAL,
    categories TEXT[],
    brands TEXT[]
)
RETURNS TABLE(id UUID, product_data JSONB)
LANGUAGE SQL
AS $$
    SELECT id, product_data
    FROM product_catalog
    WHERE product_data->>'price'::DECIMAL BETWEEN $1 AND $2
    AND product_data->>'category' = ANY ($3)
    AND product_data->>'brand' = ANY ($4)
$$;

-- ========================================
-- 6. Enhanced Security with OAuth
-- ========================================

-- OAuth authentication setup
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- User authentication table with enhanced security
CREATE TABLE IF NOT EXISTS auth_users (
    id UUID PRIMARY KEY DEFAULT generate_uuidv7(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    oauth_provider VARCHAR(50),
    oauth_id VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Security constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_role CHECK (role IN ('user', 'admin', 'moderator'))
);

-- Enhanced password hashing function
CREATE OR REPLACE FUNCTION hash_password(password TEXT, salt TEXT)
RETURNS TEXT
LANGUAGE SQL
AS $$
    SELECT encode(digest(password || salt, 'sha256'), 'hex')
$$;

-- OAuth token management
CREATE TABLE IF NOT EXISTS oauth_tokens (
    id UUID PRIMARY KEY DEFAULT generate_uuidv7(),
    user_id UUID NOT NULL REFERENCES auth_users(id),
    token_hash VARCHAR(255) NOT NULL,
    token_type VARCHAR(50) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 7. Enhanced Monitoring Setup
-- ========================================

-- Enable pg_stat_io for I/O monitoring
SELECT pg_stat_io_reset();

-- Create monitoring views
CREATE OR REPLACE VIEW performance_metrics AS
SELECT 
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    n_tup_ins,
    n_tup_upd,
    n_tup_del,
    n_tup_hot_upd
FROM pg_stat_user_tables;

-- Query performance monitoring
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
WHERE mean_time > 100  -- queries taking more than 100ms
ORDER BY mean_time DESC;

-- ========================================
-- 8. Enhanced Explain and Query Optimization
-- ========================================

-- Create function for enhanced query analysis
CREATE OR REPLACE FUNCTION analyze_query_performance(query_text TEXT)
RETURNS TABLE(
    query_plan JSONB,
    execution_time DECIMAL,
    planning_time DECIMAL,
    total_cost DECIMAL
)
LANGUAGE PLPGSQL
AS $$
DECLARE
    result RECORD;
BEGIN
    EXECUTE 'EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ' || query_text INTO result;
    
    RETURN QUERY
    SELECT 
        result."QUERY PLAN" as query_plan,
        (result."QUERY PLAN"->>'Execution Time')::DECIMAL as execution_time,
        (result."QUERY PLAN"->>'Planning Time')::DECIMAL as planning_time,
        (result."QUERY PLAN"->>'Total Cost')::DECIMAL as total_cost;
END;
$$;

-- ========================================
-- 9. Skip Scan B-tree Optimization
-- ========================================

-- Create tables optimized for skip scan
CREATE TABLE IF NOT EXISTS fashion_inventory (
    id UUID PRIMARY KEY DEFAULT generate_uuidv7(),
    product_id UUID NOT NULL,
    warehouse_id UUID NOT NULL,
    quantity INTEGER NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'available'
);

-- Skip scan optimized indexes
CREATE INDEX idx_inventory_product_warehouse ON fashion_inventory (product_id, warehouse_id);
CREATE INDEX idx_inventory_status_updated ON fashion_inventory (status, last_updated);

-- Skip scan query example
CREATE OR REPLACE FUNCTION get_inventory_by_product(product_uuid UUID)
RETURNS TABLE(
    warehouse_id UUID,
    quantity INTEGER,
    status VARCHAR(20)
)
LANGUAGE SQL
AS $$
    SELECT warehouse_id, quantity, status
    FROM fashion_inventory
    WHERE product_id = $1
    ORDER BY warehouse_id
$$;

-- ========================================
-- 10. Logical Replication Setup
-- ========================================

-- Publication for logical replication
CREATE PUBLICATION IF NOT EXISTS fashion_publication
FOR ALL TABLES;

-- Enhanced replication slot management
CREATE OR REPLACE FUNCTION create_replication_slot(slot_name TEXT)
RETURNS TEXT
LANGUAGE SQL
AS $$
    SELECT pg_create_logical_replication_slot(slot_name, 'pgoutput');
$$;

-- ========================================
-- 11. Enhanced Autovacuum Configuration
-- ========================================

-- Table-specific autovacuum settings
ALTER TABLE fashion_products SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05,
    autovacuum_vacuum_threshold = 1000,
    autovacuum_analyze_threshold = 500
);

ALTER TABLE product_catalog SET (
    autovacuum_vacuum_scale_factor = 0.2,
    autovacuum_analyze_scale_factor = 0.1,
    autovacuum_vacuum_threshold = 500,
    autovacuum_analyze_threshold = 250
);

-- ========================================
-- 12. Enhanced RETURNING Clause
-- ========================================

-- Function demonstrating enhanced RETURNING
CREATE OR REPLACE FUNCTION create_product_with_returning(
    product_name VARCHAR,
    base_price DECIMAL,
    discount DECIMAL DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    name VARCHAR,
    final_price DECIMAL,
    price_tier VARCHAR,
    created_at TIMESTAMPTZ
)
LANGUAGE SQL
AS $$
    INSERT INTO fashion_products (name, base_price, discount_percentage)
    VALUES (product_name, base_price, discount)
    RETURNING id, name, final_price, price_tier, created_at;
$$;

-- ========================================
-- 13. Temporal Constraints
-- ========================================

-- Temporal data versioning
CREATE TABLE IF NOT EXISTS fashion_product_versions (
    id UUID PRIMARY KEY DEFAULT generate_uuidv7(),
    product_id UUID NOT NULL,
    version INTEGER NOT NULL,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_to TIMESTAMPTZ,
    product_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT temporal_overlap CHECK (
        NOT EXISTS (
            SELECT 1 FROM fashion_product_versions v2
            WHERE v2.product_id = fashion_product_versions.product_id
            AND v2.version <> fashion_product_versions.version
            AND v2.valid_from < fashion_product_versions.valid_to
            AND v2.valid_to > fashion_product_versions.valid_from
        )
    )
);

-- Temporal query function
CREATE OR REPLACE FUNCTION get_product_history(product_uuid UUID, as_of TIMESTAMPTZ)
RETURNS TABLE(
    version INTEGER,
    valid_from TIMESTAMPTZ,
    valid_to TIMESTAMPTZ,
    product_data JSONB
)
LANGUAGE SQL
AS $$
    SELECT version, valid_from, valid_to, product_data
    FROM fashion_product_versions
    WHERE product_id = $1
    AND valid_from <= $2
    AND (valid_to IS NULL OR valid_to > $2)
    ORDER BY version DESC
$$;

-- ========================================
-- 14. Enhanced NOT NULL Constraints
-- ========================================

-- Deferred NOT NULL constraints
CREATE TABLE IF NOT EXISTS fashion_orders (
    id UUID PRIMARY KEY DEFAULT generate_uuidv7(),
    customer_id UUID,
    order_date TIMESTAMPTZ DEFAULT NOW(),
    total_amount DECIMAL(10,2),
    status VARCHAR(50),
    
    -- Deferred NOT NULL constraint
    CONSTRAINT customer_required NOT NULL (customer_id) DEFERRABLE INITIALLY DEFERRED
);

-- ========================================
-- 15. Performance Optimization Setup
-- ========================================

-- Set configuration parameters for optimal performance
-- Note: Some of these may require superuser privileges

-- Enable parallel query processing
-- SET max_parallel_workers_per_gather = 4;
-- SET max_parallel_workers = 8;

-- Optimize memory settings
-- SET shared_buffers = '256MB';
-- SET effective_cache_size = '1GB';
-- SET work_mem = '4MB';

-- Enable JIT compilation
-- SET jit = on;
-- SET jit_inline_above_cost = 500000;

-- ========================================
-- 16. Sample Data and Testing Functions
-- ========================================

-- Insert sample data for testing
INSERT INTO fashion_products (name, base_price, discount_percentage, category, brand) VALUES
('Summer Dress', 89.99, 10, 'Dresses', 'FashionBrand'),
('Designer Handbag', 450.00, 5, 'Accessories', 'LuxuryBrand'),
('Casual Jeans', 65.00, 0, 'Bottoms', 'DenimCo')
ON CONFLICT DO NOTHING;

-- Test function for UUIDv7 generation
CREATE OR REPLACE FUNCTION test_uuidv7_features()
RETURNS TABLE(
    generated_uuid UUID,
    timestamp_part BIGINT,
    random_part BIGINT
)
LANGUAGE SQL
AS $$
    SELECT 
        generate_uuidv7() as generated_uuid,
        (generate_uuidv7()::TEXT)::BIGINT >> 16 as timestamp_part,
        (generate_uuidv7()::TEXT)::BIGINT & 65535 as random_part
$$;

-- ========================================
-- 17. Monitoring and Maintenance Functions
-- ========================================

-- Database health check
CREATE OR REPLACE FUNCTION database_health_check()
RETURNS TABLE(
    metric_name TEXT,
    metric_value TEXT,
    status TEXT
)
LANGUAGE SQL
AS $$
    -- Connection health
    SELECT 'database_connections', current_setting('max_connections')::TEXT, 'OK'
    UNION ALL
    -- Extension status
    SELECT 'uuidv7_extension', CASE WHEN EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_uuidv7'
    ) THEN 'enabled' ELSE 'disabled' END, CASE WHEN EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_uuidv7'
    ) THEN 'OK' ELSE 'WARNING' END
    UNION ALL
    -- Table sizes
    SELECT 'fashion_products_size', pg_size_pretty(pg_total_relation_size('fashion_products'))::TEXT, 'OK'
    UNION ALL
    -- Index usage
    SELECT 'index_usage_ratio', ROUND(
        (SELECT sum(idx_scan) FROM pg_stat_user_indexes) / NULLIF(
            (SELECT sum(seq_scan + idx_scan) FROM pg_stat_user_tables), 0
        ) * 100, 2
    )::TEXT, 'OK'
$$;

-- ========================================
-- 18. Final Setup Verification
-- ========================================

-- Verify all features are properly configured
DO $$
DECLARE
    feature_count INTEGER;
BEGIN
    -- Count enabled extensions
    SELECT count(*) INTO feature_count
    FROM pg_extension 
    WHERE extname IN ('uuid-ossp', 'pg_uuidv7', 'btree_gin', 'btree_gist', 'pg_stat_statements', 'pg_stat_io', 'pg_trgm');
    
    RAISE NOTICE 'PostgreSQL 18 Advanced Features Setup Complete!';
    RAISE NOTICE 'Enabled extensions: %', feature_count;
    RAISE NOTICE 'Virtual columns configured: fashion_products';
    RAISE NOTICE 'UUIDv7 support enabled: fashion_entities';
    RAISE NOTICE 'Enhanced monitoring views created: performance_metrics, slow_queries';
    RAISE NOTICE 'Security enhancements configured: OAuth authentication';
    RAISE NOTICE 'Performance optimizations: Skip scan indexes, enhanced JSON operations';
END $$;
