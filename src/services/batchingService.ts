import { RedisService } from '../config/redis';
import { PineconeService } from '../config/pinecone';
import { LangChainService } from '../config/langchain';

export interface BatchOperation {
  id: string;
  type: 'vector_upsert' | 'ai_generation' | 'cache_update';
  data: any;
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  attempts: number;
  maxAttempts: number;
}

export class BatchingService {
  private static readonly BATCH_SIZE = 10;
  private static readonly BATCH_TIMEOUT = 5000; // 5 seconds
  private static batches: Map<string, BatchOperation[]> = new Map();
  private static timers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Add operation to batch
   */
  static async addToBatch(
    batchType: string,
    operation: Omit<BatchOperation, 'id' | 'createdAt' | 'attempts'>
  ): Promise<string> {
    const batchOperation: BatchOperation = {
      ...operation,
      id: `${batchType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      attempts: 0,
    };

    if (!this.batches.has(batchType)) {
      this.batches.set(batchType, []);
    }

    const batch = this.batches.get(batchType)!;
    batch.push(batchOperation);

    // Sort by priority (high first)
    batch.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Set timer to process batch if not already set
    if (!this.timers.has(batchType)) {
      this.timers.set(batchType, setTimeout(() => {
        this.processBatch(batchType);
      }, this.BATCH_TIMEOUT));
    }

    // Process immediately if batch is full
    if (batch.length >= this.BATCH_SIZE) {
      clearTimeout(this.timers.get(batchType)!);
      this.timers.delete(batchType);
      await this.processBatch(batchType);
    }

    return batchOperation.id;
  }

  /**
   * Process batch of operations
   */
  private static async processBatch(batchType: string): Promise<void> {
    const batch = this.batches.get(batchType);
    if (!batch || batch.length === 0) {
      this.batches.delete(batchType);
      return;
    }

    console.log(`Processing batch ${batchType} with ${batch.length} operations`);

    try {
      switch (batchType) {
        case 'vector_upsert':
          await this.processVectorUpsertBatch(batch);
          break;
        case 'ai_generation':
          await this.processAIGenerationBatch(batch);
          break;
        case 'cache_update':
          await this.processCacheUpdateBatch(batch);
          break;
        default:
          console.warn(`Unknown batch type: ${batchType}`);
      }
    } catch (error) {
      console.error(`Failed to process batch ${batchType}:`, error);
      
      // Retry failed operations
      const failedOperations = batch.filter(op => op.attempts < op.maxAttempts);
      if (failedOperations.length > 0) {
        failedOperations.forEach(op => op.attempts++);
        // Add back to batch for retry
        this.batches.set(batchType, failedOperations);
      }
    } finally {
      // Clear processed batch
      this.batches.delete(batchType);
      this.timers.delete(batchType);
    }
  }

  /**
   * Process vector upsert batch
   */
  private static async processVectorUpsertBatch(batch: BatchOperation[]): Promise<void> {
    const vectors = batch
      .filter(op => op.attempts === 0) // Only process first attempt
      .map(op => op.data);

    if (vectors.length === 0) return;

    try {
      await PineconeService.upsertVectors(vectors);
      console.log(`Successfully upserted ${vectors.length} vectors in batch`);
    } catch (error) {
      console.error('Vector upsert batch failed:', error);
      throw error;
    }
  }

  /**
   * Process AI generation batch
   */
  private static async processAIGenerationBatch(batch: BatchOperation[]): Promise<void> {
    const operations = batch.filter(op => op.attempts === 0);
    
    for (const operation of operations) {
      try {
        const { type, data } = operation.data;
        
        switch (type) {
          case 'recommendations':
            await LangChainService.generateFashionRecommendations(
              data.preferences,
              data.occasion,
              data.season
            );
            break;
          case 'image_analysis':
            await LangChainService.analyzeFashionImage(
              data.imageUrl,
              data.description
            );
            break;
          case 'style_tags':
            await LangChainService.generateStyleTags(
              data.itemName,
              data.description,
              data.category
            );
            break;
          default:
            console.warn(`Unknown AI operation type: ${type}`);
        }
      } catch (error) {
        console.error(`AI operation failed for ${operation.id}:`, error);
        // Continue with other operations
      }
    }
  }

  /**
   * Process cache update batch
   */
  private static async processCacheUpdateBatch(batch: BatchOperation[]): Promise<void> {
    const operations = batch.filter(op => op.attempts === 0);
    
    for (const operation of operations) {
      try {
        const { key, value, ttl } = operation.data;
        await RedisService.set(key, value, { ttl });
      } catch (error) {
        console.error(`Cache update failed for ${operation.id}:`, error);
        // Continue with other operations
      }
    }
  }

  /**
   * Get batch statistics
   */
  static async getBatchStats(): Promise<any> {
    const stats = {
      pendingBatches: this.batches.size,
      totalPendingOperations: Array.from(this.batches.values()).reduce((sum, batch) => sum + batch.length, 0),
      batchTypes: {} as Record<string, number>,
    };

    for (const [batchType, batch] of this.batches.entries()) {
      stats.batchTypes[batchType] = batch.length;
    }

    return stats;
  }

  /**
   * Force process all pending batches
   */
  static async forceProcessAllBatches(): Promise<void> {
    const batchTypes = Array.from(this.batches.keys());
    
    for (const batchType of batchTypes) {
      if (this.timers.has(batchType)) {
        clearTimeout(this.timers.get(batchType)!);
        this.timers.delete(batchType);
      }
      await this.processBatch(batchType);
    }
  }

  /**
   * Clear all pending batches
   */
  static clearAllBatches(): void {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    
    // Clear all batches
    this.batches.clear();
    this.timers.clear();
    
    console.log('All batches cleared');
  }

  /**
   * Batch AI recommendations for multiple users
   */
  static async batchRecommendations(users: Array<{
    id: string;
    preferences: any;
    occasion?: string;
    season?: string;
  }>): Promise<void> {
    for (const user of users) {
      await this.addToBatch('ai_generation', {
        type: 'ai_generation',
        data: {
          type: 'recommendations',
          userId: user.id,
          preferences: user.preferences,
          occasion: user.occasion,
          season: user.season,
        },
        priority: 'medium',
        maxAttempts: 3,
      });
    }
  }

  /**
   * Batch vector upserts for fashion items
   */
  static async batchVectorUpserts(vectors: Array<{
    id: string;
    values: number[];
    metadata: any;
  }>): Promise<void> {
    for (const vector of vectors) {
      await this.addToBatch('vector_upsert', {
        type: 'vector_upsert',
        data: vector,
        priority: 'high',
        maxAttempts: 3,
      });
    }
  }

  /**
   * Batch cache updates
   */
  static async batchCacheUpdates(updates: Array<{
    key: string;
    value: any;
    ttl?: number;
  }>): Promise<void> {
    for (const update of updates) {
      await this.addToBatch('cache_update', {
        type: 'cache_update',
        data: update,
        priority: 'low',
        maxAttempts: 2,
      });
    }
  }
}

export default BatchingService;
