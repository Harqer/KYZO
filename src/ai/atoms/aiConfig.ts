/**
 * ATOM: AI Configuration
 * Atomic Design Pattern - Smallest reusable unit
 */

export interface AIConfig {
  openaiApiKey: string;
  apifyToken: string;
  pineconeApiKey: string;
  clerkSecretKey: string;
  clerkPublishableKey: string;
  environment: 'development' | 'production';
}

export interface AIModels {
  embedding: 'text-embedding-ada-002';
  chat: 'gpt-4';
  image: 'dall-e-3';
  analysis: 'gpt-4-vision-preview';
}

export interface AISettings {
  maxTokens: number;
  temperature: number;
  topK: number;
  similarityThreshold: number;
  batchSize: number;
  rateLimitPerMinute: number;
}

// AI configuration atom
export class AIConfiguration {
  private static config: AIConfig;
  private static models: AIModels;
  private static settings: AISettings;

  static initialize(): void {
    this.config = {
      openaiApiKey: process.env.OPENAI_API_KEY || '',
      apifyToken: process.env.APIFY_TOKEN || '',
      pineconeApiKey: process.env.PINECONE_API_KEY || '',
      clerkSecretKey: process.env.CLERK_SECRET_KEY || '',
      clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || '',
      environment: (process.env.NODE_ENV as 'development' | 'production') || 'development',
    };

    this.models = {
      embedding: 'text-embedding-ada-002',
      chat: 'gpt-4',
      image: 'dall-e-3',
      analysis: 'gpt-4-vision-preview',
    };

    this.settings = {
      maxTokens: 4000,
      temperature: 0.7,
      topK: 10,
      similarityThreshold: 0.8,
      batchSize: 100,
      rateLimitPerMinute: 60,
    };
  }

  // Atom: Get configuration
  static getConfig(): AIConfig {
    if (!this.config) {
      this.initialize();
    }
    return this.config;
  }

  // Atom: Get models
  static getModels(): AIModels {
    if (!this.models) {
      this.initialize();
    }
    return this.models;
  }

  // Atom: Get settings
  static getSettings(): AISettings {
    if (!this.settings) {
      this.initialize();
    }
    return this.settings;
  }

  // Atom: Validate configuration
  static validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config = this.getConfig();

    if (!config.openaiApiKey) {
      errors.push('OpenAI API key is required');
    }

    if (!config.pineconeApiKey) {
      errors.push('Pinecone API key is required');
    }

    if (!config.apifyToken) {
      errors.push('Apify token is required');
    }

    if (!config.clerkSecretKey) {
      errors.push('Clerk secret key is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Atom: Get API key by service
  static getApiKey(service: 'openai' | 'apify' | 'pinecone' | 'clerk'): string {
    const config = this.getConfig();
    
    switch (service) {
      case 'openai':
        return config.openaiApiKey;
      case 'apify':
        return config.apifyToken;
      case 'pinecone':
        return config.pineconeApiKey;
      case 'clerk':
        return config.clerkSecretKey;
      default:
        return '';
    }
  }

  // Atom: Check if production
  static isProduction(): boolean {
    return this.getConfig().environment === 'production';
  }

  // Atom: Get model configuration
  static getModelConfig(model: keyof AIModels): string {
    return this.getModels()[model];
  }

  // Atom: Get setting value
  static getSetting(setting: keyof AISettings): number {
    return this.getSettings()[setting];
  }

  // Atom: Update setting
  static updateSetting(setting: keyof AISettings, value: number): void {
    this.settings[setting] = value;
  }
}

// Export atoms for composition
export { AIConfiguration as ConfigAtom, AIConfig, AIModels, AISettings };
