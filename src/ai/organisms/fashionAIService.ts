/**
 * ORGANISM: Fashion AI Service
 * Atomic Design Pattern - Complex UI section combining molecules and atoms
 */

import { AIConfiguration, ConfigAtom } from '../atoms/aiConfig';
import { FashionLangGraphWorkflow, LangGraphMolecule } from '../molecules/langGraphWorkflow';
import { FashionCrewAgents, CrewAIMolecule } from '../molecules/crewAIAgents';
import { AIEmbeddingService, EmbeddingMolecule } from '../molecules/aiEmbedding';

export interface FashionAIRequest {
  query: string;
  userPreferences?: any;
  budget?: number;
  category?: string;
  style?: string;
  occasion?: string;
}

export interface FashionAIResponse {
  searchResults: any[];
  recommendations: any[];
  alternatives?: any[];
  marketingInsights?: any[];
  priceComparisons?: any[];
  crewAnalysis?: any;
  error?: string;
  metadata?: {
    executionTime: number;
    workflowSteps: string[];
    agentResults: any;
    costAnalysis: any;
  };
}

// Fashion AI service organism
export class FashionAIService {
  private config: ConfigAtom;
  private langGraphWorkflow: LangGraphMolecule;
  private crewAgents: CrewAIMolecule;
  private embeddingService: EmbeddingMolecule;

  constructor() {
    this.config = AIConfiguration;
    this.langGraphWorkflow = new FashionLangGraphWorkflow();
    this.crewAgents = new FashionCrewAgents();
    this.embeddingService = new AIEmbeddingService();
  }

  // Organism: Complete AI-powered fashion search
  async processFashionRequest(request: FashionAIRequest): Promise<FashionAIResponse> {
    const startTime = Date.now();
    
    try {
      console.log(`Processing fashion AI request: ${request.query}`);
      
      // Step 1: Execute LangGraph workflow for comprehensive analysis
      const langGraphResult = await this.langGraphWorkflow.executeWorkflow({
        userQuery: request.query,
        userPreferences: request.userPreferences,
        budget: request.budget,
        category: request.category,
        style: request.style,
        occasion: request.occasion,
      });

      if (langGraphResult.error) {
        throw new Error(`LangGraph workflow failed: ${langGraphResult.error}`);
      }

      // Step 2: Execute CrewAI for specialized analysis
      const crewRequest = {
        userQuery: request.query,
        userPreferences: request.userPreferences,
        budget: request.budget,
        category: request.category,
        style: request.style,
        occasion: request.occasion,
        searchResults: langGraphResult.searchResults,
      };

      const crewResult = await this.crewAgents.executeFashionCrew(crewRequest);

      // Step 3: Generate enhanced recommendations using embeddings
      const enhancedRecommendations = await this.generateEnhancedRecommendations(
        langGraphResult,
        crewResult,
        request
      );

      // Step 4: Create comprehensive response
      const executionTime = Date.now() - startTime;
      
      const response: FashionAIResponse = {
        searchResults: langGraphResult.searchResults,
        recommendations: enhancedRecommendations.recommendations,
        alternatives: enhancedRecommendations.alternatives,
        marketingInsights: crewResult.marketingInsights,
        priceComparisons: langGraphResult.priceComparisons || [],
        crewAnalysis: crewResult.agentResults,
        metadata: {
          executionTime,
          workflowSteps: this.getWorkflowSteps(langGraphResult, crewResult),
          agentResults: crewResult.agentResults,
          costAnalysis: await this.analyzeCosts(langGraphResult, crewResult),
        },
      };

      console.log(`Fashion AI request completed in ${executionTime}ms`);
      return response;
      
    } catch (error) {
      console.error('Fashion AI service error:', error);
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        searchResults: [],
        recommendations: [],
        alternatives: [],
        marketingInsights: [],
        priceComparisons: [],
        crewAnalysis: null,
        error: `AI processing failed: ${errorMessage}`,
        metadata: {
          executionTime,
          workflowSteps: ['error'],
          agentResults: {},
          costAnalysis: { error: errorMessage },
        },
      };
    }
  }

  // Organism: Generate enhanced recommendations
  private async generateEnhancedRecommendations(
    langGraphResult: any,
    crewResult: any,
    request: FashionAIRequest
  ): Promise<{
    recommendations: any[];
    alternatives: any[];
  }> {
    try {
      // Combine results from all AI systems
      const combinedResults = [
        ...langGraphResult.searchResults,
        ...langGraphResult.recommendations,
        ...crewResult.recommendations,
      ];

      // Generate embeddings for semantic similarity
      const queryEmbedding = await this.embeddingService.generateEmbedding({
        text: request.query,
        metadata: { type: 'user_query', category: request.category },
      });

      // Find semantically similar items
      const similarItemsResponse = await this.embeddingService.searchSimilarItems({
        query: request.query,
        topK: 20,
        filter: request.budget ? { maxPrice: request.budget } : undefined,
      });

      const similarItems = similarItemsResponse.matches || [];

      // Create hybrid recommendations
      const recommendations = this.createHybridRecommendations(
        combinedResults,
        similarItems,
        request
      );

      // Generate alternatives if budget specified
      const alternatives = request.budget 
        ? await this.generateBudgetAlternatives(combinedResults, request.budget, request)
        : [];

      return {
        recommendations,
        alternatives,
      };
    } catch (error) {
      console.error('Failed to generate enhanced recommendations:', error);
      return {
        recommendations: [],
        alternatives: [],
      };
    }
  }

  // Organism: Create hybrid recommendations
  private createHybridRecommendations(
    allResults: any[],
    similarItems: any[],
    request: FashionAIRequest
  ): any[] {
    // Score and rank items based on multiple factors
    const scoredItems = allResults.map(item => ({
      ...item,
      aiScore: this.calculateAIScore(item, request),
      similarityScore: this.calculateSimilarityScore(item, similarItems),
      valueScore: this.calculateValueScore(item, request),
      trendScore: this.calculateTrendScore(item, request),
    }));

    // Sort by combined score
    scoredItems.sort((a, b) => {
      const scoreA = a.aiScore + a.similarityScore + a.valueScore + a.trendScore;
      const scoreB = b.aiScore + b.similarityScore + b.valueScore + b.trendScore;
      return scoreB - scoreA;
    });

    // Generate personalized recommendations
    return scoredItems.slice(0, 10).map((item, index) => ({
      id: item.id || `recommendation_${index}`,
      title: item.title || item.name,
      description: item.description,
      price: item.price,
      originalPrice: item.originalPrice,
      discount: item.discount,
      retailer: item.retailer || item.brand,
      imageUrl: item.imageUrl || item.image,
      category: item.category,
      brand: item.brand,
      color: item.color,
      style: item.style,
      occasion: item.occasion,
      tags: item.tags,
      availability: item.availability,
      rating: item.rating,
      reviewCount: item.reviewCount,
      scores: {
        ai: item.aiScore,
        similarity: item.similarityScore,
        value: item.valueScore,
        trend: item.trendScore,
        total: item.aiScore + item.similarityScore + item.valueScore + item.trendScore,
      },
      recommendation: this.generateRecommendationText(item, request),
      confidence: this.calculateConfidence(item, request),
    }));
  }

  // Organism: Generate budget alternatives
  private async generateBudgetAlternatives(
    items: any[],
    budget: number,
    request: FashionAIRequest
  ): Promise<any[]> {
    try {
      // Filter items within budget
      const budgetItems = items.filter(item => 
        item.price && item.price <= budget * 1.1 // Allow 10% over budget for better quality
      );

      // Find best value alternatives
      const alternatives = budgetItems
        .map(item => ({
          ...item,
          savings: Math.max(0, (item.originalPrice || item.price) - item.price),
          savingsPercentage: item.originalPrice 
            ? ((item.originalPrice - item.price) / item.originalPrice) * 100 
            : 0,
          valueScore: this.calculateValueScore({ ...item, price: budget }, request),
        budgetFit: item.price <= budget,
        recommendation: this.generateAlternativeRecommendation(item, budget, request),
        }))
        .sort((a, b) => b.valueScore - a.valueScore)
        .slice(0, 5);

      return alternatives;
    } catch (error) {
      console.error('Failed to generate budget alternatives:', error);
      return [];
    }
  }

  // Organism: Calculate AI scores
  private calculateAIScore(item: any, request: FashionAIRequest): number {
    let score = 50; // Base score

    // Price competitiveness
    if (item.price && request.budget) {
      if (item.price <= request.budget * 0.5) score += 20;
      else if (item.price <= request.budget * 0.8) score += 10;
      else if (item.price <= request.budget) score += 5;
    }

    // Availability
    if (item.availability === 'in_stock') score += 15;
    else if (item.availability === 'limited_stock') score += 5;

    // Rating
    if (item.rating >= 4.5) score += 15;
    else if (item.rating >= 4.0) score += 10;
    else if (item.rating >= 3.5) score += 5;

    // Brand popularity
    const popularBrands = ['nike', 'adidas', 'puma', 'new balance', 'vans'];
    if (item.brand && popularBrands.includes(item.brand.toLowerCase())) score += 10;

    // Style matching
    if (request.style && item.style && item.style.toLowerCase().includes(request.style.toLowerCase())) score += 10;

    // Category relevance
    if (request.category && item.category && item.category.toLowerCase().includes(request.category.toLowerCase())) score += 10;

    return Math.min(100, score);
  }

  // Organism: Calculate similarity score
  private calculateSimilarityScore(item: any, similarItems: any[]): number {
    const similar = similarItems.find(similar => 
      similar.id === item.id || similar.title === item.title
    );
    
    return similar ? 20 : 0; // Boost score for exact matches
  }

  // Organism: Calculate value score
  private calculateValueScore(item: any, request: FashionAIRequest): number {
    let score = 50; // Base score

    // Discount analysis
    if (item.discount && item.discount > 20) score += 20;
    else if (item.discount && item.discount > 10) score += 10;
    else if (item.discount && item.discount > 5) score += 5;

    // Price per quality
    if (item.rating >= 4.0 && item.price < 50) score += 15;
    else if (item.rating >= 3.5 && item.price < 100) score += 10;
    else if (item.rating >= 3.0 && item.price < 200) score += 5;

    // Brand value
    const premiumBrands = ['nike', 'adidas', 'puma'];
    const budgetBrands = ['uniqlo', 'h&m', 'zara'];
    
    if (request.budget && request.budget < 100 && budgetBrands.includes(item.brand?.toLowerCase())) score += 15;
    else if (request.budget && request.budget < 200 && premiumBrands.includes(item.brand?.toLowerCase())) score += 10;

    return Math.min(100, score);
  }

  // Organism: Calculate trend score
  private calculateTrendScore(item: any, request: FashionAIRequest): number {
    let score = 20; // Base score

    // Recent items
    if (item.createdAt) {
      const itemDate = new Date(item.createdAt);
      const daysSinceCreation = (Date.now() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceCreation <= 7) score += 30;
      else if (daysSinceCreation <= 30) score += 20;
      else if (daysSinceCreation <= 90) score += 10;
    }

    // Trending categories
    const trendingCategories = ['streetwear', 'athleisure', 'sustainable_fashion'];
    if (item.category && trendingCategories.includes(item.category?.toLowerCase())) score += 15;

    // Trending colors
    const trendingColors = ['black', 'white', 'gray', 'beige', 'navy'];
    if (item.color && trendingColors.includes(item.color?.toLowerCase())) score += 10;

    return Math.min(100, score);
  }

  // Organism: Calculate confidence score
  private calculateConfidence(item: any, request: FashionAIRequest): number {
    let confidence = 50; // Base confidence

    // Data completeness
    if (item.title && item.description && item.price && item.imageUrl) confidence += 20;
    if (item.rating && item.reviewCount) confidence += 15;
    if (item.brand && item.category) confidence += 10;

    // Preference matching
    if (request.userPreferences) {
      if (request.userPreferences.favoriteBrands?.includes(item.brand)) confidence += 15;
      if (request.userPreferences.preferredColors?.includes(item.color)) confidence += 10;
      if (request.userPreferences.stylePreferences?.some(style => item.style?.includes(style))) confidence += 10;
    }

    // Budget alignment
    if (request.budget && item.price <= request.budget) confidence += 20;
    else if (request.budget && item.price <= request.budget * 1.2) confidence += 10;

    return Math.min(100, confidence);
  }

  // Organism: Generate recommendation text
  private generateRecommendationText(item: any, request: FashionAIRequest): string {
    const reasons = [];

    if (item.discount && item.discount > 15) {
      reasons.push(`Excellent value with ${item.discount}% discount`);
    }

    if (item.rating >= 4.5) {
      reasons.push(`Highly rated (${item.rating}/5 stars) by ${item.reviewCount} customers`);
    }

    if (request.budget && item.price <= request.budget * 0.8) {
      reasons.push(`Great value within your $${request.budget} budget`);
    }

    if (request.style && item.style?.toLowerCase().includes(request.style.toLowerCase())) {
      reasons.push(`Perfect match for your ${request.style} style`);
    }

    if (item.availability === 'in_stock') {
      reasons.push('Currently available and ready to ship');
    }

    return reasons.length > 0 ? reasons.join('. ') : 'Recommended based on style and value';
  }

  // Organism: Generate alternative recommendation
  private generateAlternativeRecommendation(item: any, budget: number, request: FashionAIRequest): string {
    const savings = item.savings || 0;
    const savingsPercentage = item.savingsPercentage || 0;
    
    let recommendation = `Save $${savings.toFixed(2)} (${savingsPercentage.toFixed(0)}% discount)`;
    
    if (item.valueScore >= 80) {
      recommendation += ` with excellent value and quality`;
    } else if (item.valueScore >= 60) {
      recommendation += ` with good value for the price`;
    }

    if (request.style && item.style?.toLowerCase().includes(request.style.toLowerCase())) {
      recommendation += ` that matches your ${request.style} style`;
    }

    return recommendation;
  }

  // Organism: Analyze costs
  private async analyzeCosts(langGraphResult: any, crewResult: any): Promise<any> {
    try {
      // Estimate API costs
      const openaiCosts = this.estimateOpenAICosts(langGraphResult, crewResult);
      const apifyCosts = this.estimateApifyCosts(langGraphResult);
      
      return {
        totalEstimatedCost: openaiCosts.total + apifyCosts.total,
        openai: openaiCosts,
        apify: apifyCosts,
        costBreakdown: {
          embeddings: openaiCosts.embeddings,
          chat: openaiCosts.chat,
          scraping: apifyCosts.scraping,
          analysis: openaiCosts.analysis + apifyCosts.analysis,
        },
        optimization: this.generateCostOptimizations(openaiCosts, apifyCosts),
      };
    } catch (error) {
      console.error('Failed to analyze costs:', error);
      return { error: error.message };
    }
  }

  // Organism: Estimate OpenAI costs
  private estimateOpenAICosts(langGraphResult: any, crewResult: any): any {
    const embeddingTokens = (langGraphResult.embeddings?.length || 0) * 1536; // Approximate tokens per embedding
    const chatTokens = (langGraphResult.messages?.length || 0) * 1000; // Approximate tokens per message
    
    return {
      embeddings: {
        tokens: embeddingTokens,
        estimatedCost: (embeddingTokens / 1000) * 0.0001, // $0.001 per 1K tokens
      },
      chat: {
        tokens: chatTokens,
        estimatedCost: (chatTokens / 1000) * 0.002, // $0.002 per 1K tokens for GPT-4
      },
      analysis: {
        tokens: chatTokens / 2, // Assume analysis uses half the chat tokens
        estimatedCost: (chatTokens / 2 / 1000) * 0.002,
      },
      total: (embeddingTokens / 1000) * 0.0001 + (chatTokens / 1000) * 0.002 + (chatTokens / 2 / 1000) * 0.002,
    };
  }

  // Organism: Estimate Apify costs
  private estimateApifyCosts(results: any): any {
    // Estimate based on typical Apify pricing
    const itemsScraped = results.searchResults?.length || 0;
    const pagesScraped = Math.ceil(itemsScraped / 20); // Assume 20 items per page
    
    return {
      scraping: {
        itemsScraped,
        pagesScraped,
        estimatedCost: pagesScraped * 0.001, // $0.001 per page
      },
      analysis: {
        itemsAnalyzed: itemsScraped,
        estimatedCost: itemsScraped * 0.0005, // $0.0005 per item analysis
      },
      total: pagesScraped * 0.001 + itemsScraped * 0.0005,
    };
  }

  // Organism: Generate cost optimizations
  private generateCostOptimizations(openaiCosts: any, apifyCosts: any): any[] {
    const optimizations = [];
    
    // Embedding optimizations
    if (openaiCosts.embeddings.tokens > 10000) {
      optimizations.push({
        category: 'embeddings',
        suggestion: 'Cache embeddings to reduce OpenAI API calls',
        potentialSavings: 'Up to 80% reduction in embedding costs',
        implementation: 'Implement Redis caching for frequently used embeddings',
      });
    }
    
    // Chat optimizations
    if (openaiCosts.chat.tokens > 50000) {
      optimizations.push({
        category: 'chat',
        suggestion: 'Use smaller models for simple tasks',
        potentialSavings: 'Up to 60% reduction in chat costs',
        implementation: 'Use GPT-3.5-turbo for basic queries, GPT-4 for complex analysis',
      });
    }
    
    // Scraping optimizations
    if (apifyCosts.scraping.pagesScraped > 100) {
      optimizations.push({
        category: 'scraping',
        suggestion: 'Implement intelligent caching',
        potentialSavings: 'Up to 50% reduction in scraping costs',
        implementation: 'Cache search results for 24 hours, use incremental updates',
      });
    }
    
    return optimizations;
  }

  // Organism: Get workflow steps
  private getWorkflowSteps(langGraphResult: any, crewResult: any): string[] {
    const steps = [
      'query_processing',
      'embedding_generation',
      'similarity_search',
      'langgraph_workflow',
      'crewai_analysis',
      'recommendation_generation',
      'alternative_finding',
      'finalization',
    ];
    
    // Add error steps if applicable
    if (langGraphResult.error) steps.push('langgraph_error');
    if (crewResult.crewExecution?.success === false) steps.push('crewai_error');
    
    return steps;
  }

  // Organism: Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: {
      config: any;
      langgraph: any;
      crewai: any;
      embeddings: any;
    };
    timestamp: string;
  }> {
    try {
      const configValidation = this.config.validateConfig();
      const langgraphHealth = await this.langGraphWorkflow.getWorkflowStatus('health-check');
      const crewaiHealth = await this.crewAgents.getCrewPerformanceMetrics('health-check');
      const embeddingHealth = this.embeddingService.getCacheStats();
      
      const overallStatus = configValidation.isValid && 
        langgraphHealth.status === 'healthy' && 
        crewaiHealth.executionTime < 30000 ? 'healthy' : 'degraded';
      
      return {
        status: overallStatus,
        services: {
          config: configValidation,
          langgraph: langgraphHealth,
          crewai: crewaiHealth,
          embeddings: embeddingHealth,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Fashion AI service health check failed:', error);
      return {
        status: 'unhealthy',
        services: { error: error.message },
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Organism: Performance metrics
  async getPerformanceMetrics(): Promise<{
    totalRequests: number;
    averageResponseTime: number;
    successRate: number;
    costAnalysis: any;
    agentPerformance: any;
  }> {
    try {
      // This would integrate with a monitoring system
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        successRate: 100,
        costAnalysis: {},
        agentPerformance: {},
      };
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        successRate: 0,
        costAnalysis: { error: error.message },
        agentPerformance: {},
      };
    }
  }
}

// Export organism for composition
export { FashionAIService as FashionAIOrganism };
