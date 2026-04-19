import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Client as LangSmithClient } from 'langsmith';

// LangChain configuration
export class LangChainService {
  private static llm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'gpt-4-turbo-preview',
    temperature: 0.7,
    maxTokens: 1000,
  });

  private static langsmith = process.env.LANGSMITH_API_KEY 
    ? new LangSmithClient({
        apiKey: process.env.LANGSMITH_API_KEY,
      })
    : null;

  /**
   * Generate fashion recommendations based on user preferences
   */
  static async generateFashionRecommendations(
    userPreferences: any,
    occasion?: string,
    season?: string
  ): Promise<string> {
    try {
      const systemPrompt = `You are a professional fashion stylist AI. 
      Based on the user's preferences and the given occasion/season, provide personalized fashion recommendations.
      Focus on:
      1. Outfit combinations
      2. Color coordination
      3. Style suggestions
      4. Accessory recommendations
      5. Specific brand suggestions if relevant
      
      Be specific, practical, and consider the user's stated preferences.`;

      const userPrompt = `User Preferences:
      ${JSON.stringify(userPreferences, null, 2)}
      
      ${occasion ? `Occasion: ${occasion}` : ''}
      ${season ? `Season: ${season}` : ''}
      
      Please provide detailed fashion recommendations for this user.`;

      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ]);

      return response.content as string;
    } catch (error) {
      console.error('Failed to generate fashion recommendations:', error);
      throw new Error('Failed to generate AI recommendations');
    }
  }

  /**
   * Analyze fashion image and extract style information
   */
  static async analyzeFashionImage(
    imageUrl: string,
    description?: string
  ): Promise<any> {
    try {
      const systemPrompt = `You are a fashion analysis AI. Analyze the given fashion image and provide detailed information about:
      1. Clothing items and categories
      2. Colors and color combinations
      3. Style (e.g., casual, formal, streetwear, etc.)
      4. Seasonal appropriateness
      5. Occasion suitability
      6. Brand suggestions (if identifiable)
      7. Styling tips
      
      Provide the response in JSON format with the following structure:
      {
        "items": [{"category": "top/bottom/shoes/accessories", "description": "...", "color": "..."}],
        "style": "...",
        "season": "...",
        "occasion": "...",
        "colors": ["..."],
        "stylingTips": ["..."],
        "brandSuggestions": ["..."]
      }`;

      const userPrompt = `Please analyze this fashion image:
      Image URL: ${imageUrl}
      ${description ? `Additional description: ${description}` : ''}`;

      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ]);

      // Parse JSON response
      try {
        return JSON.parse(response.content as string);
      } catch (parseError) {
        return { analysis: response.content as string };
      }
    } catch (error) {
      console.error('Failed to analyze fashion image:', error);
      throw new Error('Failed to analyze image with AI');
    }
  }

  /**
   * Generate outfit combinations from user's wardrobe
   */
  static async generateOutfitCombinations(
    wardrobeItems: any[],
    preferences: any
  ): Promise<any[]> {
    try {
      const systemPrompt = `You are a professional stylist AI. Generate outfit combinations from the user's wardrobe items.
      Consider:
      1. Color coordination
      2. Style compatibility
      3. Occasion appropriateness
      4. Seasonal suitability
      5. User preferences
      
      Return combinations in JSON format:
      [{
        "name": "Outfit name",
        "items": ["item1", "item2", "item3"],
        "occasion": "...",
        "season": "...",
        "style": "...",
        "description": "..."
      }]`;

      const userPrompt = `Wardrobe Items:
      ${JSON.stringify(wardrobeItems, null, 2)}
      
      User Preferences:
      ${JSON.stringify(preferences, null, 2)}
      
      Generate 3-5 outfit combinations from these items.`;

      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ]);

      try {
        return JSON.parse(response.content as string);
      } catch (parseError) {
        return [{ combinations: response.content as string }];
      }
    } catch (error) {
      console.error('Failed to generate outfit combinations:', error);
      throw new Error('Failed to generate outfit combinations');
    }
  }

  /**
   * Provide fashion advice based on user query
   */
  static async getFashionAdvice(query: string, userContext?: any): Promise<string> {
    try {
      const systemPrompt = `You are a knowledgeable fashion advisor AI. Provide helpful, practical fashion advice.
      Consider the user's context if provided, but focus on giving actionable advice.
      Be encouraging and positive in your responses.`;

      const userPrompt = userContext 
        ? `User Context: ${JSON.stringify(userContext, null, 2)}\n\nQuestion: ${query}`
        : `Question: ${query}`;

      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ]);

      return response.content as string;
    } catch (error) {
      console.error('Failed to get fashion advice:', error);
      throw new Error('Failed to get AI advice');
    }
  }

  /**
   * Log AI interactions to LangSmith
   */
  static async logToLangSmith(
    runName: string,
    inputs: any,
    outputs: any,
    error?: any
  ): Promise<void> {
    if (!this.langsmith) return;

    try {
      // This is a simplified version - in production, you'd use the LangSmith tracing
      console.log(`LangSmith Log - ${runName}:`, { inputs, outputs, error });
    } catch (error) {
      console.error('Failed to log to LangSmith:', error);
    }
  }

  /**
   * Generate style tags for fashion items
   */
  static async generateStyleTags(
    itemName: string,
    description: string,
    category: string
  ): Promise<string[]> {
    try {
      const systemPrompt = `You are a fashion tagging AI. Generate relevant style tags for fashion items.
      Tags should include:
      1. Style (e.g., casual, formal, streetwear, vintage, etc.)
      2. Occasion (e.g., work, party, casual, etc.)
      3. Season (e.g., summer, winter, all-season)
      4. Material (if mentioned)
      5. Color (if mentioned)
      6. Fit (e.g., slim, relaxed, oversized)
      
      Return as a JSON array of strings: ["tag1", "tag2", "tag3"]`;

      const userPrompt = `Item Name: ${itemName}
      Description: ${description}
      Category: ${category}
      
      Generate relevant style tags for this item.`;

      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ]);

      try {
        return JSON.parse(response.content as string);
      } catch (parseError) {
        // Fallback: extract tags from text response
        return (response.content as string).split(',').map(tag => tag.trim()).filter(Boolean);
      }
    } catch (error) {
      console.error('Failed to generate style tags:', error);
      return [];
    }
  }

  /**
   * Create fashion look description
   */
  static async createLookDescription(
    items: any[],
    style: string,
    occasion?: string
  ): Promise<string> {
    try {
      const systemPrompt = `You are a creative fashion writer. Create an engaging and appealing description for a fashion look.
      The description should:
      1. Be evocative and appealing
      2. Highlight the key pieces and how they work together
      3. Mention the style and occasion
      4. Include styling tips
      5. Be 2-3 paragraphs long`;

      const userPrompt = `Items in the look:
      ${JSON.stringify(items, null, 2)}
      
      Style: ${style}
      ${occasion ? `Occasion: ${occasion}` : ''}
      
      Create an appealing description for this look.`;

      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ]);

      return response.content as string;
    } catch (error) {
      console.error('Failed to create look description:', error);
      throw new Error('Failed to generate AI description');
    }
  }
}

export default LangChainService;
