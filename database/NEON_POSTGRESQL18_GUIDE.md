# PostgreSQL 18 Advanced Features Setup Guide for Neon

This comprehensive guide covers all the advanced PostgreSQL 18 features configured for your Neon database to optimize your fashion enterprise application.

## Table of Contents

1. [Setup Overview](#setup-overview)
2. [UUIDv7 Support](#uuidv7-support)
3. [Virtual Generated Columns](#virtual-generated-columns)
4. [Enhanced Array Operations](#enhanced-array-operations)
5. [Advanced JSON Features](#advanced-json-features)
6. [Security Enhancements](#security-enhancements)
7. [Performance Optimizations](#performance-optimizations)
8. [Enhanced Monitoring](#enhanced-monitoring)
9. [Logical Replication](#logical-replication)
10. [Query Optimization](#query-optimization)
11. [Usage Examples](#usage-examples)
12. [Maintenance & Best Practices](#maintenance--best-practices)

## Setup Overview

### What's Been Configured

- **UUIDv7**: Time-ordered UUIDs for better performance
- **Virtual Columns**: Computed values stored automatically
- **Enhanced JSON**: Optimized JSONB operations with path queries
- **Array Operations**: GIN-indexed arrays for fast lookups
- **Full-Text Search**: Advanced search with ranking
- **Security**: OAuth authentication and row-level security
- **Monitoring**: pg_stat_io and enhanced performance tracking
- **Replication**: Logical replication with conflict resolution

### Files Created

- `postgresql18-advanced-setup.sql` - Main setup script
- `setup-neon-advanced.js` - Node.js setup automation
- `neon-monitoring.js` - Comprehensive monitoring script
- `neon-advanced-config.json` - Configuration file

## UUIDv7 Support

### What is UUIDv7?

UUIDv7 is a time-ordered UUID that provides better database performance due to its sequential nature. Unlike traditional UUIDv4, UUIDv7s are roughly ordered by creation time.

### Implementation

```sql
-- Enable the extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_uuidv7;

-- Create a UUIDv7 generation function
CREATE OR REPLACE FUNCTION generate_uuidv7()
RETURNS UUID
LANGUAGE SQL
AS $$
    SELECT uuid_generate_v7();
$$;
```

### Usage Examples

```sql
-- Create a table with UUIDv7 primary key
CREATE TABLE fashion_products (
    id UUID PRIMARY KEY DEFAULT generate_uuidv7(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert data (UUIDv7 generated automatically)
INSERT INTO fashion_products (name) VALUES ('Summer Dress');

-- Query by time range (efficient due to time-ordered nature)
SELECT * FROM fashion_products 
WHERE created_at >= '2024-01-01' 
ORDER BY id;  -- This is roughly chronological
```

### Benefits

- **Better Performance**: Sequential UUIDs reduce index fragmentation
- **Time Ordering**: Roughly chronological without separate timestamp
- **Uniqueness**: Globally unique identifiers
- **Compatibility**: Standard UUID format

## Virtual Generated Columns

### What are Virtual Columns?

Virtual columns are computed columns that are automatically calculated from other columns in the same row. PostgreSQL 18 supports both `STORED` and `VIRTUAL` generated columns.

### Implementation

```sql
-- Product table with virtual columns
CREATE TABLE fashion_products (
    id UUID PRIMARY KEY DEFAULT generate_uuidv7(),
    name VARCHAR(255) NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    
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
```

### Usage Examples

```sql
-- Insert data (virtual columns calculated automatically)
INSERT INTO fashion_products (name, base_price, discount_percentage, brand, category)
VALUES ('Designer Handbag', 450.00, 10, 'LuxuryBrand', 'Accessories');

-- Query virtual columns (no calculation needed)
SELECT name, base_price, final_price, price_tier
FROM fashion_products;

-- Full-text search using virtual search vector
SELECT name, category
FROM fashion_products
WHERE search_vector @@ plainto_tsquery('handbag & luxury');
```

### Benefits

- **Automatic Updates**: Values stay consistent with base data
- **Storage Efficiency**: Computed once, stored for fast access
- **Query Performance**: No runtime calculation overhead
- **Data Integrity**: Prevents manual computation errors

## Enhanced Array Operations

### What's Enhanced?

PostgreSQL 18 provides improved array operations with better GIN indexing and aggregation functions.

### Implementation

```sql
-- Fashion trends with enhanced array operations
CREATE TABLE fashion_trends (
    id UUID PRIMARY KEY DEFAULT generate_uuidv7(),
    trend_name VARCHAR(255) NOT NULL,
    tags TEXT[] NOT NULL,
    color_palette TEXT[] NOT NULL,
    style_keywords TEXT[] NOT NULL
);

-- Enhanced array indexes
CREATE INDEX idx_trends_tags ON fashion_trends USING GIN (tags);
CREATE INDEX idx_trends_color_palette ON fashion_trends USING GIN (color_palette);
CREATE INDEX idx_trends_style_keywords ON fashion_trends USING GIN (style_keywords);
```

### Usage Examples

```sql
-- Insert data with arrays
INSERT INTO fashion_trends (trend_name, tags, color_palette, style_keywords)
VALUES (
    'Minimalist Chic',
    ARRAY['minimal', 'clean', 'neutral'],
    ARRAY['white', 'beige', 'gray', 'black'],
    ARRAY['sleek', 'modern', 'simple']
);

-- Array containment queries
SELECT trend_name FROM fashion_trends
WHERE tags @> ARRAY['minimal'];

-- Array overlap queries
SELECT trend_name FROM fashion_trends
WHERE color_palette && ARRAY['black', 'white'];

-- Array aggregation
SELECT unnest(tags) as tag, count(*) as frequency
FROM fashion_trends
GROUP BY tag
ORDER BY frequency DESC;
```

### Benefits

- **Fast Array Queries**: GIN indexes enable efficient array operations
- **Flexible Data**: Store multiple values in a single column
- **Powerful Operations**: Containment, overlap, and aggregation functions
- **Space Efficient**: Better than normalized tables for sparse data

## Advanced JSON Features

### What's Enhanced?

PostgreSQL 18 provides enhanced JSONB operations with path queries, better indexing, and improved performance.

### Implementation

```sql
-- Product catalog with enhanced JSON
CREATE TABLE product_catalog (
    id UUID PRIMARY KEY DEFAULT generate_uuidv7(),
    product_data JSONB NOT NULL,
    search_index JSONB DEFAULT '{}'
);

-- Enhanced JSON indexes
CREATE INDEX idx_catalog_product_data ON product_catalog USING GIN (product_data);
CREATE INDEX idx_catalog_search_index ON product_catalog USING GIN (search_index);
```

### Usage Examples

```sql
-- Insert complex JSON data
INSERT INTO product_catalog (product_data, search_index) VALUES
('{
  "name": "Summer Floral Dress",
  "price": 76.49,
  "category": "Dresses",
  "brand": "FashionBrand",
  "colors": ["red", "blue", "yellow"],
  "sizes": ["XS", "S", "M", "L", "XL"],
  "materials": ["cotton", "silk"],
  "metadata": {
    "season": "Summer",
    "target_audience": ["women", "casual"],
    "care_instructions": "Machine wash cold"
  }
}', '{
  "searchable_text": "summer floral dress fashionbrand casual cotton silk",
  "price_range": "mid",
  "popularity_score": 85
}');

-- JSON path queries
SELECT 
    product_data->>'name' as name,
    product_data->>'price'::DECIMAL as price,
    product_data->'colors' as colors,
    product_data->'metadata'->>'season' as season
FROM product_catalog;

-- Advanced JSON filtering
SELECT id, product_data
FROM product_catalog
WHERE product_data->>'price'::DECIMAL BETWEEN 50 AND 100
AND product_data->>'category' = ANY (ARRAY['Dresses', 'Tops'])
AND product_data->'colors' @> '["blue"]';

-- JSON aggregation
SELECT 
    jsonb_agg(
        jsonb_build_object(
            'name', product_data->>'name',
            'price', product_data->>'price'::DECIMAL,
            'category', product_data->>'category'
        )
    ) as products
FROM product_catalog
WHERE product_data->>'brand' = 'FashionBrand';
```

### Benefits

- **Flexible Schema**: Store varying data structures
- **Powerful Queries**: Path-based access to nested data
- **Efficient Indexing**: GIN indexes for fast JSON operations
- **Type Safety**: JSONB provides validation and performance

## Security Enhancements

### OAuth Authentication

```sql
-- OAuth authentication setup
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- User authentication table
CREATE TABLE auth_users (
    id UUID PRIMARY KEY DEFAULT generate_uuidv7(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    oauth_provider VARCHAR(50),
    oauth_id VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced password hashing
CREATE OR REPLACE FUNCTION hash_password(password TEXT, salt TEXT)
RETURNS TEXT
LANGUAGE SQL
AS $$
    SELECT encode(digest(password || salt, 'sha256'), 'hex')
$$;
```

### Row-Level Security

```sql
-- Enable row-level security
ALTER TABLE fashion_products ENABLE ROW LEVEL SECURITY;

-- Create policies for tenant isolation
CREATE POLICY tenant_isolation ON fashion_products
    FOR ALL
    TO authenticated_user
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create policy for user data access
CREATE POLICY user_data_access ON auth_users
    FOR ALL
    TO authenticated_user
    USING (id = current_setting('app.current_user_id')::UUID);
```

### Benefits

- **OAuth Integration**: Support for external authentication providers
- **Row-Level Security**: Fine-grained data access control
- **Encryption**: Built-in cryptographic functions
- **Audit Trail**: Track authentication and authorization events

## Performance Optimizations

### Skip Scan B-tree

```sql
-- Create tables optimized for skip scan
CREATE TABLE fashion_inventory (
    id UUID PRIMARY KEY DEFAULT generate_uuidv7(),
    product_id UUID NOT NULL,
    warehouse_id UUID NOT NULL,
    quantity INTEGER NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Skip scan optimized indexes
CREATE INDEX idx_inventory_product_warehouse ON fashion_inventory (product_id, warehouse_id);
```

### Asynchronous I/O

```sql
-- Enable pg_stat_io for I/O monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_io;

-- Monitor I/O operations
SELECT * FROM pg_stat_io ORDER BY reads DESC;
```

### Query Optimization

```sql
-- Enhanced explain function
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
```

### Benefits

- **Skip Scan**: Efficient queries on composite indexes
- **Async I/O**: Better concurrency and throughput
- **Query Analysis**: Detailed performance insights
- **Optimization**: Automatic query plan improvements

## Enhanced Monitoring

### pg_stat_io

```sql
-- Enable I/O monitoring
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
    n_tup_del
FROM pg_stat_user_tables;
```

### Query Performance Monitoring

```sql
-- Slow queries view
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC;
```

### Health Check Function

```sql
CREATE OR REPLACE FUNCTION database_health_check()
RETURNS TABLE(
    metric_name TEXT,
    metric_value TEXT,
    status TEXT
)
LANGUAGE SQL
AS $$
    SELECT 'database_connections', current_setting('max_connections')::TEXT, 'OK'
    UNION ALL
    SELECT 'fashion_products_size', pg_size_pretty(pg_total_relation_size('fashion_products'))::TEXT, 'OK'
    UNION ALL
    SELECT 'index_usage_ratio', ROUND(
        (SELECT sum(idx_scan) FROM pg_stat_user_indexes) / NULLIF(
            (SELECT sum(seq_scan + idx_scan) FROM pg_stat_user_tables), 0
        ) * 100, 2
    )::TEXT, 'OK'
$$;
```

### Benefits

- **Real-time Monitoring**: Track database performance
- **I/O Insights**: Understand storage bottlenecks
- **Query Analysis**: Identify slow queries
- **Health Checks**: Automated status reporting

## Logical Replication

### Publication Setup

```sql
-- Create publication for all tables
CREATE PUBLICATION fashion_publication FOR ALL TABLES;

-- Publication for specific tables
CREATE PUBLICATION fashion_products_pub 
FOR TABLE fashion_products, fashion_trends;
```

### Replication Slot Management

```sql
-- Create replication slot
CREATE OR REPLACE FUNCTION create_replication_slot(slot_name TEXT)
RETURNS TEXT
LANGUAGE SQL
AS $$
    SELECT pg_create_logical_replication_slot(slot_name, 'pgoutput');
$$;
```

### Conflict Resolution

```sql
-- Handle replication conflicts
ALTER TABLE fashion_products SET (replica_identity = FULL);
```

### Benefits

- **Real-time Sync**: Keep databases synchronized
- **Selective Replication**: Choose which tables to replicate
- **Conflict Handling**: Manage data conflicts gracefully
- **High Availability**: Ensure data redundancy

## Query Optimization

### Enhanced RETURNING Clause

```sql
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
```

### Temporal Constraints

```sql
-- Temporal data versioning
CREATE TABLE fashion_product_versions (
    id UUID PRIMARY KEY DEFAULT generate_uuidv7(),
    product_id UUID NOT NULL,
    version INTEGER NOT NULL,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_to TIMESTAMPTZ,
    product_data JSONB NOT NULL,
    
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
```

### Enhanced NOT NULL Constraints

```sql
-- Deferred NOT NULL constraints
CREATE TABLE fashion_orders (
    id UUID PRIMARY KEY DEFAULT generate_uuidv7(),
    customer_id UUID,
    order_date TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT customer_required NOT NULL (customer_id) DEFERRABLE INITIALLY DEFERRED
);
```

### Benefits

- **Enhanced RETURNING**: Get computed values on insert/update
- **Temporal Data**: Track data changes over time
- **Deferred Constraints**: Complex transaction scenarios
- **Better Performance**: Optimized query execution

## Usage Examples

### Complete Product Management Workflow

```sql
-- 1. Create a product with virtual columns
INSERT INTO fashion_products (name, base_price, discount_percentage, category, brand)
VALUES ('Summer Collection Dress', 120.00, 15, 'Dresses', 'FashionBrand')
RETURNING id, name, final_price, price_tier;

-- 2. Add to catalog with JSON data
INSERT INTO product_catalog (product_data, search_index)
VALUES (
    jsonb_build_object(
        'product_id', (SELECT id FROM fashion_products WHERE name = 'Summer Collection Dress'),
        'name', 'Summer Collection Dress',
        'price', 102.00,
        'category', 'Dresses',
        'brand', 'FashionBrand',
        'colors', ARRAY['blue', 'white', 'pink'],
        'sizes', ARRAY['XS', 'S', 'M', 'L', 'XL'],
        'materials', ARRAY['cotton', 'linen'],
        'metadata', jsonb_build_object(
            'season', 'Summer',
            'collection', '2024',
            'care_instructions', 'Machine wash cold'
        )
    ),
    jsonb_build_object(
        'searchable_text', 'summer collection dress fashionbrand casual cotton linen',
        'price_range', 'mid',
        'popularity_score', 88
    )
);

-- 3. Add trend data with arrays
INSERT INTO fashion_trends (trend_name, season, year, tags, color_palette, style_keywords)
VALUES (
    'Summer Breeze',
    'Summer',
    2024,
    ARRAY['lightweight', 'breathable', 'casual', 'comfortable'],
    ARRAY['sky_blue', 'white', 'sand', 'coral'],
    ARRAY['relaxed', 'beach', 'vacation', 'airy']
);

-- 4. Full-text search across products
SELECT 
    p.name,
    p.final_price,
    p.price_tier,
    pc.product_data->>'colors' as colors
FROM fashion_products p
JOIN product_catalog pc ON p.id = (pc.product_data->>'product_id')::UUID
WHERE p.search_vector @@ plainto_tsquery('summer & dress')
ORDER BY ts_rank(p.search_vector, plainto_tsquery('summer & dress')) DESC;

-- 5. Array-based trend analysis
SELECT 
    trend_name,
    unnest(tags) as tag,
    count(*) OVER (PARTITION BY trend_name) as tag_count
FROM fashion_trends
WHERE season = 'Summer' AND year = 2024
ORDER BY trend_name, tag;

-- 6. Performance monitoring
SELECT * FROM database_health_check();

-- 7. Query performance analysis
SELECT * FROM analyze_query_performance(
    'SELECT * FROM fashion_products WHERE final_price BETWEEN 50 AND 150'
);
```

### Advanced JSON Queries

```sql
-- Find products with specific attributes
SELECT 
    product_data->>'name' as name,
    product_data->>'price'::DECIMAL as price,
    product_data->'colors' as colors
FROM product_catalog
WHERE product_data->>'price'::DECIMAL BETWEEN 50 AND 200
AND product_data->'colors' @> '["blue"]'
AND product_data->'materials' && ARRAY['cotton', 'silk'];

-- JSON aggregation for reports
SELECT 
    product_data->>'brand' as brand,
    count(*) as product_count,
    avg(product_data->>'price'::DECIMAL) as avg_price,
    jsonb_agg(product_data->>'name') as products
FROM product_catalog
GROUP BY product_data->>'brand'
ORDER BY product_count DESC;

-- Complex JSON path queries
SELECT 
    product_data->>'name' as name,
    product_data->'metadata'->>'season' as season,
    product_data->'metadata'->>'care_instructions' as care
FROM product_catalog
WHERE product_data->'metadata'->>'season' = 'Summer'
AND product_data->'metadata' ? 'care_instructions';
```

## Maintenance & Best Practices

### Regular Maintenance

```sql
-- Update statistics for optimal query planning
ANALYZE fashion_products;
ANALYZE product_catalog;
ANALYZE fashion_trends;

-- Rebuild indexes if needed
REINDEX INDEX idx_products_search_vector;
REINDEX INDEX idx_catalog_product_data;

-- Clean up old data
DELETE FROM fashion_product_versions 
WHERE valid_to < NOW() - INTERVAL '2 years';
```

### Performance Tuning

```sql
-- Monitor slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
WHERE mean_time > 100 
ORDER BY mean_time DESC;

-- Check index usage
SELECT 
    schemaname, tablename, indexname, idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Analyze table sizes
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_stat_user_tables
ORDER BY size_bytes DESC;
```

### Backup and Recovery

```sql
-- Create backup
CREATE TABLE fashion_products_backup AS TABLE fashion_products;

-- Point-in-time recovery setup
SELECT pg_create_physical_replication_slot('backup_slot');

-- Export data
COPY (
    SELECT 
        id, name, base_price, discount_percentage, 
        final_price, price_tier, created_at
    FROM fashion_products
) TO '/tmp/fashion_products.csv' WITH CSV HEADER;
```

### Security Best Practices

```sql
-- Regular security audits
SELECT 
    usename, 
    usesuper, 
    usecreatedb, 
    usecatupd,
    array_agg(
        CASE WHEN has_database_privilege(usename, datname, 'CONNECT') 
             THEN datname END
    ) as accessible_databases
FROM pg_user
CROSS JOIN pg_database
WHERE datname NOT IN ('template0', 'template1')
GROUP BY usename, usesuper, usecreatedb, usecatupd;

-- Monitor failed authentication attempts
SELECT 
    log_time, 
    username, 
    database,
    application_name
FROM pg_log
WHERE error_code = '28P01'  -- password authentication failed
ORDER BY log_time DESC
LIMIT 10;
```

## Troubleshooting

### Common Issues

1. **UUIDv7 Extension Not Available**
   ```sql
   -- Check if extension exists
   SELECT * FROM pg_available_extensions WHERE name = 'pg_uuidv7';
   
   -- Install if available
   CREATE EXTENSION pg_uuidv7;
   ```

2. **Virtual Column Errors**
   ```sql
   -- Check column dependencies
   SELECT 
       column_name, 
       generation_expression,
       is_generated
   FROM information_schema.columns
   WHERE table_schema = 'public' 
   AND table_name = 'fashion_products'
   AND is_generated = 'ALWAYS';
   ```

3. **Performance Issues**
   ```sql
   -- Check query plans
   EXPLAIN (ANALYZE, BUFFERS) 
   SELECT * FROM fashion_products 
   WHERE final_price BETWEEN 50 AND 150;
   ```

4. **Replication Lag**
   ```sql
   -- Check replication status
   SELECT * FROM pg_replication_slots;
   SELECT * FROM pg_stat_replication;
   ```

### Monitoring Queries

```sql
-- Overall database health
SELECT 
    datname,
    numbackends,
    xact_commit,
    xact_rollback,
    blks_read,
    blks_hit,
    tup_returned,
    tup_fetched,
    tup_inserted,
    tup_updated,
    tup_deleted
FROM pg_stat_database
WHERE datname = current_database();

-- Extension status
SELECT 
    extname, 
    extversion, 
    extrelocatable,
    extconfig
FROM pg_extension
ORDER BY extname;

-- Table statistics
SELECT 
    schemaname,
    tablename,
    n_live_tup,
    n_dead_tup,
    last_vacuum,
    last_analyze,
    vacuum_count,
    analyze_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

## Next Steps

1. **Update Connection String**: Replace the placeholder DATABASE_URL with your actual Neon credentials
2. **Run Setup Script**: Execute the setup script to configure all features
3. **Test Features**: Use the provided examples to test each advanced feature
4. **Monitor Performance**: Use the monitoring script to track database health
5. **Optimize Queries**: Analyze and optimize slow queries
6. **Set Up Alerts**: Configure monitoring alerts for performance issues

## Support

For additional support:
- Neon Documentation: https://neon.com/docs
- PostgreSQL 18 Features: https://www.postgresql.org/docs/18/
- Community Forum: https://community.neon.com

This setup provides a comprehensive foundation for leveraging all PostgreSQL 18 advanced features in your Neon database, ensuring optimal performance, security, and scalability for your fashion enterprise application.
