-- Fashion App Database Schema
-- Created for Neon PostgreSQL

-- Users table (synced with Clerk)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY, -- Clerk user ID
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100),
  full_name VARCHAR(255),
  profile_image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cover_image_url VARCHAR(500),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Looks table (individual fashion outfits)
CREATE TABLE IF NOT EXISTS looks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_urls TEXT[], -- Array of image URLs
  tags TEXT[], -- Array of tags
  style_preferences JSONB, -- User's style preferences
  ai_generated BOOLEAN DEFAULT false,
  ai_confidence DECIMAL(3,2), -- AI confidence score 0.00-1.00
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Items table (individual clothing items)
CREATE TABLE IF NOT EXISTS items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- e.g., "top", "bottom", "shoes", "accessories"
  brand VARCHAR(100),
  color VARCHAR(50),
  size VARCHAR(20),
  material VARCHAR(100),
  image_urls TEXT[],
  purchase_date DATE,
  price DECIMAL(10,2),
  tags TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Look_Items junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS look_items (
  look_id UUID REFERENCES looks(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  position INTEGER, -- Position of item in the look
  PRIMARY KEY (look_id, item_id)
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  style_preferences JSONB, -- User's style preferences
  size_preferences JSONB, -- User's size preferences
  color_preferences TEXT[], -- Preferred colors
  brand_preferences TEXT[], -- Preferred brands
  budget_range JSONB, -- Min and max budget
  ai_settings JSONB, -- AI generation settings
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI generations table
CREATE TABLE IF NOT EXISTS ai_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  generated_image_urls TEXT[],
  model_used VARCHAR(100), -- AI model used
  parameters JSONB, -- Generation parameters
  confidence_score DECIMAL(3,2),
  processing_time_ms INTEGER,
  cost DECIMAL(10,4), -- Cost in credits/currency
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_looks_user_id ON looks(user_id);
CREATE INDEX IF NOT EXISTS idx_looks_collection_id ON looks(collection_id);
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_ai_generations_user_id ON ai_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_status ON ai_generations(status);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_looks_updated_at BEFORE UPDATE ON looks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_generations_updated_at BEFORE UPDATE ON ai_generations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
