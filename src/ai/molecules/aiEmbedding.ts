/**
 * MOLECULE: AI Embedding Service
 * Atomic Design Pattern - Combination of atoms for AI functionality
 */

import { AIConfiguration, ConfigAtom } from '../atoms/aiConfig';

export interface EmbeddingRequest {
  text: string;
  model?: string;
  metadata?: Record<string, any>;
}

export interface EmbeddingResponse {
  embedding: number[];
  dimensions: number;
  model: string;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}

export interface VectorSearchRequest {
  query: string;
  topK?: number;
  filter?: Record<string, any>;
  includeMetadata?: boolean;
}

export interface VectorSearchResponse {
  matches: Array<{
    id: string;
    score: number;
    metadata?: Record<string, any>;
    values: number[];
  }>;
  namespace: string;
  usage: {
    readUnits: number;
  };
}

// Embedding molecule
export class AIEmbeddingService {
  private config: ConfigAtom;

  constructor() {
    this.config = AIConfiguration;
  }

  // Molecule: Generate embedding for text
  async generateEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    try {
      const model = request.model || this.config.getModelConfig('embedding');
      
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.getApiKey('openai')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          input: request.text,
          encoding_format: 'float',
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        embedding: data.data[0].embedding,
        dimensions: data.data[0].embedding.length,
        model: data.model,
        usage: data.usage,
      };
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw error;
    }
  }

  // Molecule: Batch generate embeddings
  async generateBatchEmbeddings(requests: EmbeddingRequest[]): Promise<EmbeddingResponse[]> {
    try {
      const batchSize = this.config.getSetting('batchSize');
      const results: EmbeddingResponse[] = [];

      // Process in batches to avoid rate limits
      for (let i = 0; i < requests.length; i += batchSize) {
        const batch = requests.slice(i, i + batchSize);
        
        const batchPromises = batch.map(request => 
          this.generateEmbedding(request)
        );

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Rate limiting delay
        if (i + batchSize < requests.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return results;
    } catch (error) {
      console.error('Failed to generate batch embeddings:', error);
      throw error;
    }
  }

  // Molecule: Generate embedding for fashion item
  async generateFashionEmbedding(item: {
    title: string;
    description?: string;
    tags?: string[];
    category?: string;
    brand?: string;
    color?: string;
  }): Promise<EmbeddingResponse> {
    const combinedText = [
      item.title,
      item.description || '',
      item.tags?.join(' ') || '',
      item.category || '',
      item.brand || '',
      item.color || '',
    ].filter(Boolean).join(' ');

    return this.generateEmbedding({
      text: combinedText,
      metadata: {
        type: 'fashion_item',
        title: item.title,
        category: item.category,
        brand: item.brand,
        color: item.color,
        tags: item.tags,
      },
    });
  }

  // Molecule: Generate embedding for user preferences
  async generatePreferenceEmbedding(preferences: {
    favoriteBrands?: string[];
    preferredColors?: string[];
    stylePreferences?: string[];
    sizePreferences?: any;
  }): Promise<EmbeddingResponse> {
    const preferenceText = [
      preferences.favoriteBrands?.join(' ') || '',
      preferences.preferredColors?.join(' ') || '',
      preferences.stylePreferences?.join(' ') || '',
      JSON.stringify(preferences.sizePreferences || {}),
    ].filter(Boolean).join(' ');

    return this.generateEmbedding({
      text: preferenceText,
      metadata: {
        type: 'user_preferences',
        preferences,
      },
    });
  }

  // Molecule: Search similar items
  async searchSimilarItems(request: VectorSearchRequest): Promise<VectorSearchResponse> {
    try {
      // This would integrate with Pinecone or other vector database
      const response = await fetch('https://api.pinecone.io/vectors/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.getApiKey('pinecone')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vector: await this.generateEmbedding({ text: request.query }),
            topK: request.topK || this.config.getSetting('topK'),
            filter: request.filter,
            includeMetadata: request.includeMetadata !== false,
          }),
        }),
      });

      if (!response.ok) {
        throw new Error(`Vector search error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to search similar items:', error);
      throw error;
    }
  }

  // Molecule: Calculate similarity
  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimensions');
    }

    // Cosine similarity calculation
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (norm1 * norm2);
  }

  // Molecule: Find most similar
  findMostSimilar(queryEmbedding: number[], candidateEmbeddings: number[]): {
    index: number;
    similarity: number;
  } {
    let maxSimilarity = -1;
    let bestIndex = -1;

    candidateEmbeddings.forEach((embedding, index) => {
      const similarity = this.calculateSimilarity(queryEmbedding, embedding);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        bestIndex = index;
      }
    });

    return {
      index: bestIndex,
      similarity: maxSimilarity,
    };
  }

  // Molecule: Batch similarity search
  async batchSimilaritySearch(
    queryEmbedding: number[],
    candidateEmbeddings: number[][],
    threshold: number = this.config.getSetting('similarityThreshold')
  ): Promise<number[]> {
    try {
      const similarities = candidateEmbeddings.map(embedding =>
        this.calculateSimilarity(queryEmbedding, embedding)
      );

      return similarities
        .map((similarity, index) => ({ similarity, index }))
        .filter(({ similarity }) => similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, this.config.getSetting('topK'))
        .map(({ index }) => index);
    } catch (error) {
      console.error('Failed to batch similarity search:', error);
      throw error;
    }
  }

  // Molecule: Cache embeddings
  private embeddingCache = new Map<string, EmbeddingResponse>();

  async getCachedEmbedding(text: string): Promise<EmbeddingResponse | null> {
    const cacheKey = `embedding_${text}`;
    return this.embeddingCache.get(cacheKey) || null;
  }

  async setCachedEmbedding(text: string, embedding: EmbeddingResponse): Promise<void> {
    const cacheKey = `embedding_${text}`;
    this.embeddingCache.set(cacheKey, embedding);
  }

  // Molecule: Clear cache
  clearCache(): void {
    this.embeddingCache.clear();
  }

  // Molecule: Get cache stats
  getCacheStats(): {
    size: number;
    keys: string[];
  } {
    return {
      size: this.embeddingCache.size,
      keys: Array.from(this.embeddingCache.keys()),
    };
  }
}

// Export molecule for composition
export { AIEmbeddingService as EmbeddingMolecule };
