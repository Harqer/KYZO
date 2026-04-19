import { runFashionSearch } from '../ai/langgraph/fashionWebSearch';
import { runFashionRecommendationCrew, findCheaperAlternatives, runMarketingAnalysis } from '../ai/crewai/fashionCrew';
import { PineconeService } from '../config/pinecone';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

// Initialize OpenAI for LangChain integration
const openaiLLM = new ChatOpenAI({
  modelName: "gpt-4",
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

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
  priceComparisons: any[];
  crewAnalysis?: any;
  error?: string;
}

export class FashionAIService {
  private pineconeService: PineconeService;

  constructor() {
    this.pineconeService = new PineconeService();
  }

  // Main entry point for AI-powered fashion search and recommendations
  async processFashionRequest(request: FashionAIRequest): Promise<FashionAIResponse> {
    try {
      console.log(`Processing fashion request: ${request.query}`);
      
      // Step 1: Use LangGraph for web search and initial analysis
      const langGraphResult = await runFashionSearch(request.query);
      
      if (langGraphResult.error) {
        throw new Error(`LangGraph search failed: ${langGraphResult.error}`);
      }

      // Step 2: Use CrewAI for comprehensive analysis if user has preferences
      let crewAnalysis = null;
      if (request.userPreferences) {
        crewAnalysis = await runFashionRecommendationCrew(
          request.userPreferences,
          request.budget
        );
      }

      // Step 3: Find cheaper alternatives if budget is specified
      let alternatives = null;
      if (request.budget && langGraphResult.searchResults.length > 0) {
        const topResult = langGraphResult.searchResults[0];
        alternatives = await findCheaperAlternatives(topResult, request.budget);
      }

      // Step 4: Use LangChain with Pinecone for vector search and similar items
      const vectorSearchResults = await this.performVectorSearch(request.query);

      // Step 5: Combine all results and provide comprehensive response
      const response: FashionAIResponse = {
        searchResults: langGraphResult.searchResults,
        recommendations: langGraphResult.recommendations || [],
        priceComparisons: langGraphResult.priceComparisons || [],
        marketingInsights: langGraphResult.marketingInsights || [],
        alternatives: alternatives?.tasks?.[1]?.output || null,
        crewAnalysis: crewAnalysis,
      };

      // Step 6: Store search and results in Pinecone for future learning
      await this.storeSearchResults(request, response);

      return response;
      
    } catch (error) {
      console.error('Fashion AI service error:', error);
      return {
        searchResults: [],
        recommendations: [],
        priceComparisons: [],
        marketingInsights: [],
        error: `AI processing failed: ${error}`,
      };
    }
  }

  // Vector search using LangChain and Pinecone
  private async performVectorSearch(query: string): Promise<any[]> {
    try {
      // Generate embedding for the search query
      const embedding = await this.generateEmbedding(query);
      
      // Search Pinecone for similar items
      const searchResults = await this.pineconeService.query(embedding, 10);
      
      return searchResults.matches || [];
      
    } catch (error) {
      console.error('Vector search failed:', error);
      return [];
    }
  }

  // Generate embeddings using OpenAI
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-ada-002',
          input: text,
        }),
      });

      const data = await response.json();
      return data.data[0].embedding;
      
    } catch (error) {
      console.error('Embedding generation failed:', error);
      throw error;
    }
  }

  // Store search results and user preferences for learning
  private async storeSearchResults(request: FashionAIRequest, response: FashionAIResponse): Promise<void> {
    try {
      // Create a combined data object for storage
      const storageData = {
        query: request.query,
        userPreferences: request.userPreferences,
        budget: request.budget,
        category: request.category,
        style: request.style,
        timestamp: new Date().toISOString(),
        resultsCount: response.searchResults.length,
        recommendationsCount: response.recommendations.length,
        hasAlternatives: !!response.alternatives,
      };

      // Generate embedding for storage
      const embedding = await this.generateEmbedding(JSON.stringify(storageData));
      
      // Store in Pinecone for future personalization
      await this.pineconeService.upsert([
        {
          id: `search_${Date.now()}`,
          values: embedding,
          metadata: storageData,
        },
      ]);
      
    } catch (error) {
      console.error('Failed to store search results:', error);
      // Don't throw error here as this is not critical for the main functionality
    }
  }

  // Get personalized recommendations based on user history
  async getPersonalizedRecommendations(userId: string): Promise<any[]> {
    try {
      // Query Pinecone for user's past searches and preferences
      const userHistory = await this.pineconeService.query(
        await this.generateEmbedding(userId),
        20
      );

      // Analyze patterns and generate personalized recommendations
      const prompt = `
        Based on this user's fashion search history:
        ${JSON.stringify(userHistory.matches?.map(m => m.metadata) || [], null, 2)}
        
        Generate personalized fashion recommendations considering:
        1. Frequently searched categories and styles
        2. Budget preferences from historical data
        3. Seasonal patterns in their searches
        4. Brands and items they've shown interest in
        
        Provide 5 personalized recommendations with reasoning for each.
        Format as JSON array of recommendation objects.
      `;

      const response = await openaiLLM.invoke([new HumanMessage(prompt)]);
      const recommendations = JSON.parse(response.content as string);
      
      return recommendations;
      
    } catch (error) {
      console.error('Personalized recommendations failed:', error);
      return [];
    }
  }

  // Advanced outfit suggestion using all AI technologies
  async generateOutfitSuggestions(
    userId: string,
    occasion: string,
    style: string,
    budget?: number
  ): Promise<any[]> {
    try {
      // Step 1: Get user's personalized data
      const personalizedData = await this.getPersonalizedRecommendations(userId);
      
      // Step 2: Use LangGraph for comprehensive search
      const searchQuery = `${style} outfits for ${occasion}${budget ? ` under $${budget}` : ''}`;
      const searchResults = await runFashionSearch(searchQuery);
      
      // Step 3: Use CrewAI for expert styling analysis
      const crewRequest = {
        userPreferences: {
          occasion,
          style,
          budget,
          personalizedHistory: personalizedData,
        },
        budget,
      };
      
      const crewAnalysis = await runFashionRecommendationCrew(crewRequest.userPreferences, budget);
      
      // Step 4: Combine results with vector search for similar items
      const vectorResults = await this.performVectorSearch(searchQuery);
      
      // Step 5: Use LangChain to generate final outfit suggestions
      const outfitPrompt = `
        Combine these AI analysis results to create perfect outfit suggestions:
        
        Search Results: ${JSON.stringify(searchResults, null, 2)}
        Crew Analysis: ${JSON.stringify(crewAnalysis, null, 2)}
        Vector Similar Items: ${JSON.stringify(vectorResults, null, 2)}
        Personalized Data: ${JSON.stringify(personalizedData, null, 2)}
        
        Occasion: ${occasion}
        Style: ${style}
        Budget: ${budget || 'Not specified'}
        
        Generate 3 complete outfit suggestions with:
        1. Main pieces (tops, bottoms, shoes, accessories)
        2. Styling notes and combinations
        3. Price breakdown and total cost
        4. Confidence score for each suggestion
        
        Format as JSON array of outfit objects.
      `;

      const finalResponse = await openaiLLM.invoke([new HumanMessage(outfitPrompt)]);
      const outfitSuggestions = JSON.parse(finalResponse.content as string);
      
      return outfitSuggestions;
      
    } catch (error) {
      console.error('Outfit suggestion failed:', error);
      return [];
    }
  }

  // Marketing insights for fashion businesses
  async generateMarketingInsights(
    targetAudience: string,
    productCategory: string
  ): Promise<any> {
    try {
      return await runMarketingAnalysis(targetAudience, productCategory);
    } catch (error) {
      console.error('Marketing insights generation failed:', error);
      return { error: `Marketing analysis failed: ${error}` };
    }
  }

  // Real-time price monitoring and alerts
  async monitorPriceChanges(itemIds: string[]): Promise<any[]> {
    try {
      // This would integrate with price monitoring APIs
      // For now, we'll simulate with periodic checks
      
      const priceUpdates = itemIds.map(itemId => ({
        itemId,
        currentPrice: Math.random() * 200 + 50, // Simulated price
        previousPrice: Math.random() * 200 + 50,
        priceChange: Math.random() * 20 - 10, // -10% to +10%
        lastChecked: new Date().toISOString(),
        alert: Math.random() > 0.7, // 30% chance of significant price change
      }));

      return priceUpdates.filter(update => update.alert);
      
    } catch (error) {
      console.error('Price monitoring failed:', error);
      return [];
    }
  }
}
