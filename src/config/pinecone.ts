import { Pinecone, PineconeRecord } from '@pinecone-database/pinecone';

// Pinecone configuration
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'fashion-vectors';
const DIMENSION = 1536; // OpenAI embedding dimension
const METRIC = 'cosine';

export interface FashionVector {
  id: string;
  values: number[];
  metadata: {
    userId: string;
    type: 'look' | 'item' | 'collection' | 'style';
    name: string;
    description?: string;
    tags?: string[];
    category?: string;
    brand?: string;
    color?: string;
    style?: string;
    occasion?: string;
    season?: string;
    imageUrl?: string;
    createdAt: string;
    updatedAt: string;
  };
}

export class PineconeService {
  private static index = pinecone.index(INDEX_NAME);

  /**
   * Initialize Pinecone index
   */
  static async initializeIndex(): Promise<void> {
    try {
      // Check if index exists
      const indexes = await pinecone.listIndexes();
      const indexExists = indexes.indexes?.some(index => index.name === INDEX_NAME);

      if (!indexExists) {
        console.log(`Creating Pinecone index: ${INDEX_NAME}`);
        await pinecone.createIndex({
          name: INDEX_NAME,
          dimension: DIMENSION,
          metric: METRIC,
          spec: {
            pod: {
              environment: process.env.PINECONE_ENVIRONMENT || 'us-west1-gcp',
              podType: 'p1.x1'
            }
          }
        });
        
        // Wait for index to be ready
        console.log('Waiting for index to be ready...');
        await this.waitForIndexReady();
      } else {
        console.log(`Pinecone index ${INDEX_NAME} already exists`);
      }

      this.index = pinecone.index(INDEX_NAME);
    } catch (error) {
      console.error('Failed to initialize Pinecone index:', error);
      throw error;
    }
  }

  /**
   * Wait for index to be ready
   */
  private static async waitForIndexReady(): Promise<void> {
    let isReady = false;
    let attempts = 0;
    const maxAttempts = 30;

    while (!isReady && attempts < maxAttempts) {
      try {
        const description = await pinecone.describeIndex(INDEX_NAME);
        isReady = description.status?.ready === true;
        
        if (!isReady) {
          console.log(`Index not ready, waiting... (attempt ${attempts + 1}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          attempts++;
        }
      } catch (error) {
        console.error('Error checking index status:', error);
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      }
    }

    if (!isReady) {
      throw new Error('Index failed to become ready within timeout period');
    }
  }

  /**
   * Upsert vectors to Pinecone
   */
  static async upsertVectors(vectors: FashionVector[]): Promise<void> {
    try {
      await this.index.upsert({ records: vectors });
      console.log(`Successfully upserted ${vectors.length} vectors`);
    } catch (error) {
      console.error('Failed to upsert vectors:', error);
      throw error;
    }
  }

  /**
   * Search for similar vectors
   */
  static async searchSimilar(
    queryVector: number[],
    topK: number = 10,
    filter?: Record<string, any>
  ): Promise<any[]> {
    try {
      const queryOptions: any = {
        vector: queryVector,
        topK,
        includeMetadata: true,
      };

      if (filter) {
        queryOptions.filter = filter;
      }

      const results = await this.index.query(queryOptions);
      return results.matches || [];
    } catch (error) {
      console.error('Failed to search vectors:', error);
      throw error;
    }
  }

  /**
   * Delete vectors by IDs
   */
  static async deleteVectors(ids: string[]): Promise<void> {
    try {
      await this.index.deleteMany(ids);
      console.log(`Successfully deleted ${ids.length} vectors`);
    } catch (error) {
      console.error('Failed to delete vectors:', error);
      throw error;
    }
  }

  /**
   * Delete vectors by filter
   */
  static async deleteByFilter(filter: Record<string, any>): Promise<void> {
    try {
      await this.index.deleteMany(filter);
      console.log('Successfully deleted vectors by filter');
    } catch (error) {
      console.error('Failed to delete vectors by filter:', error);
      throw error;
    }
  }

  /**
   * Get vector by ID
   */
  static async getVector(id: string): Promise<any | null> {
    try {
      const results = await this.index.fetch({ ids: [id] });
      return results.records?.[0] || null;
    } catch (error) {
      console.error('Failed to get vector:', error);
      return null;
    }
  }

  /**
   * Update vector metadata
   */
  static async updateMetadata(id: string, metadata: Partial<FashionVector['metadata']>): Promise<void> {
    try {
      const existingVector = await this.getVector(id);
      if (!existingVector) {
        throw new Error(`Vector with ID ${id} not found`);
      }

      const updatedVector: FashionVector = {
        id,
        values: existingVector.values || [],
        metadata: {
          userId: existingVector.metadata?.userId || '',
          type: existingVector.metadata?.type || 'style',
          name: existingVector.metadata?.name || '',
          createdAt: existingVector.metadata?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...metadata,
        },
      };

      await this.upsertVectors([updatedVector]);
    } catch (error) {
      console.error('Failed to update vector metadata:', error);
      throw error;
    }
  }

  /**
   * Get index statistics
   */
  static async getIndexStats(): Promise<any> {
    try {
      return await this.index.describeIndexStats();
    } catch (error) {
      console.error('Failed to get index stats:', error);
      throw error;
    }
  }

  /**
   * Generate vector ID
   */
  static generateVectorId(type: string, userId: string, entityId: string): string {
    return `${type}_${userId}_${entityId}`;
  }

  /**
   * Create fashion vector from data
   */
  static createFashionVector(
    type: FashionVector['metadata']['type'],
    userId: string,
    entityId: string,
    embedding: number[],
    metadata: Omit<FashionVector['metadata'], 'userId' | 'type' | 'createdAt' | 'updatedAt'>
  ): FashionVector {
    return {
      id: this.generateVectorId(type, userId, entityId),
      values: embedding,
      metadata: {
        userId,
        type,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...metadata,
      },
    };
  }
}

export { pinecone, INDEX_NAME, DIMENSION, METRIC };
