import { Agent, Task, Crew } from 'crewai';
import { ChatOpenAI } from '@langchain/openai';
import { PineconeService } from '../../config/pinecone';

// Initialize the LLM for CrewAI
const llm = new ChatOpenAI({
  modelName: "gpt-4",
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// Fashion Stylist Agent - Specializes in style advice and outfit coordination
export const fashionStylist = new Agent({
  role: 'Fashion Stylist',
  goal: 'Provide expert fashion advice and create stylish outfit combinations',
  backstory: `You are a professional fashion stylist with over 10 years of experience in the fashion industry.
  You have worked with celebrities, fashion magazines, and high-end clients. You understand current trends,
  body types, color theory, and how to create looks that make people feel confident and stylish.`,
  tools: [],
  llm,
  verbose: true,
});

// Market Research Analyst - Specializes in fashion trends and market analysis
export const marketAnalyst = new Agent({
  role: 'Fashion Market Analyst',
  goal: 'Analyze fashion trends, pricing strategies, and market opportunities',
  backstory: `You are a data-driven fashion market analyst who specializes in identifying emerging trends,
  analyzing consumer behavior, and understanding the competitive landscape. You have access to real-time
  market data and can provide insights on pricing, popularity, and market positioning.`,
  tools: [],
  llm,
  verbose: true,
});

// Personal Shopper Agent - Specializes in finding the best deals and alternatives
export const personalShopper = new Agent({
  role: 'Personal Shopper',
  goal: 'Find the best fashion items, deals, and alternatives for user preferences',
  backstory: `You are an expert personal shopper with connections across multiple retailers and brands.
  You excel at finding hidden gems, negotiating deals, and identifying high-quality alternatives
  that fit within budget constraints while maintaining style and quality standards.`,
  tools: [],
  llm,
  verbose: true,
});

// Content Creator Agent - Specializes in fashion content and descriptions
export const contentCreator = new Agent({
  role: 'Fashion Content Creator',
  goal: 'Create compelling fashion content, descriptions, and marketing materials',
  backstory: `You are a creative fashion writer and content creator who specializes in crafting
  engaging descriptions, social media content, and marketing copy that resonates with fashion-conscious
  audiences. You understand how to make fashion items appealing and desirable.`,
  tools: [],
  llm,
  verbose: true,
});

// Create a comprehensive fashion recommendation crew
export function createFashionRecommendationCrew(userPreferences: any, budget?: number): Crew {
  // Task for the Fashion Stylist
  const styleAnalysisTask = new Task({
    description: `
      Analyze the user's fashion preferences and provide style recommendations:
      
      User Preferences:
      ${JSON.stringify(userPreferences, null, 2)}
      
      Budget: ${budget || 'Not specified'}
      
      Your task:
      1. Analyze the user's style preferences and body type considerations
      2. Suggest appropriate outfit combinations and color schemes
      3. Identify key pieces that would enhance their wardrobe
      4. Provide specific styling tips and recommendations
      
      Focus on creating versatile, stylish looks that align with current trends while respecting personal preferences.
    `,
    agent: fashionStylist,
    expectedOutput: 'Detailed style analysis with specific outfit recommendations and styling advice',
  });

  // Task for the Market Analyst
  const marketAnalysisTask = new Task({
    description: `
      Analyze current fashion market trends and opportunities based on user preferences:
      
      User Preferences:
      ${JSON.stringify(userPreferences, null, 2)}
      
      Your task:
      1. Identify current fashion trends relevant to the user's preferences
      2. Analyze pricing strategies for similar items in the market
      3. Identify emerging opportunities and popular brands
      4. Provide insights on seasonal trends and timing
      
      Focus on actionable market insights that can inform purchasing decisions.
    `,
    agent: marketAnalyst,
    expectedOutput: 'Comprehensive market analysis with trend insights and pricing information',
  });

  // Task for the Personal Shopper
  const shoppingTask = new Task({
    description: `
      Find specific fashion items and deals based on user preferences and market analysis:
      
      User Preferences:
      ${JSON.stringify(userPreferences, null, 2)}
      Budget: ${budget || 'Not specified'}
      
      Your task:
      1. Identify specific items that match the user's preferences and budget
      2. Find the best deals and alternatives across different retailers
      3. Compare prices and value propositions
      4. Recommend specific purchasing strategies and timing
      
      Focus on finding the best value options while maintaining quality and style standards.
    `,
    agent: personalShopper,
    expectedOutput: 'Specific shopping recommendations with price comparisons and deals',
  });

  // Task for the Content Creator
  const contentCreationTask = new Task({
    description: `
      Create compelling fashion content based on the analysis and recommendations:
      
      Your task:
      1. Write engaging descriptions for recommended items
      2. Create styling tips and how-to-wear guides
      3. Develop social media content ideas
      4. Craft compelling marketing copy for the recommendations
      
      Focus on creating content that makes the fashion recommendations appealing and actionable.
    `,
    agent: contentCreator,
    expectedOutput: 'Compelling fashion content including descriptions and styling guides',
  });

  return new Crew({
    agents: [fashionStylist, marketAnalyst, personalShopper, contentCreator],
    tasks: [styleAnalysisTask, marketAnalysisTask, shoppingTask, contentCreationTask],
    verbose: true,
  });
}

// Create a specialized crew for finding cheaper alternatives
export function createAlternativeFinderCrew(originalItem: any, targetPrice: number): Crew {
  const alternativeSearchTask = new Task({
    description: `
      Find cheaper alternatives to this fashion item:
      
      Original Item:
      ${JSON.stringify(originalItem, null, 2)}
      
      Target Price: $${targetPrice}
      
      Your task:
      1. Identify similar items from different brands and retailers
      2. Compare features, quality, and styling options
      3. Find the best value alternatives under the target price
      4. Provide pros and cons for each alternative
      
      Focus on finding the best balance between price, quality, and style.
    `,
    agent: personalShopper,
    expectedOutput: 'List of cheaper alternatives with detailed comparisons',
  });

  const qualityAnalysisTask = new Task({
    description: `
      Analyze the quality and value proposition of the alternatives found:
      
      Your task:
      1. Evaluate the quality indicators for each alternative
      2. Assess the long-term value and durability
      3. Compare brand reputation and customer reviews
      4. Provide recommendations on which alternatives offer the best value
      
      Focus on ensuring the cheaper alternatives don't compromise too much on quality.
    `,
    agent: marketAnalyst,
    expectedOutput: 'Quality analysis with value assessment for each alternative',
  });

  return new Crew({
    agents: [personalShopper, marketAnalyst],
    tasks: [alternativeSearchTask, qualityAnalysisTask],
    verbose: true,
  });
}

// Create a crew for marketing and trend analysis
export function createMarketingAnalysisCrew(targetAudience: string, productCategory: string): Crew {
  const trendAnalysisTask = new Task({
    description: `
      Analyze current fashion trends for this target audience and product category:
      
      Target Audience: ${targetAudience}
      Product Category: ${productCategory}
      
      Your task:
      1. Identify current and emerging trends in this category
      2. Analyze what resonates with the target audience
      3. Identify key influencers and style icons
      4. Predict upcoming trends and opportunities
      
      Focus on actionable trend insights that can inform marketing and product decisions.
    `,
    agent: marketAnalyst,
    expectedOutput: 'Comprehensive trend analysis with marketing insights',
  });

  const contentStrategyTask = new Task({
    description: `
      Develop a content strategy based on the trend analysis:
      
      Target Audience: ${targetAudience}
      Product Category: ${productCategory}
      
      Your task:
      1. Create content themes and messaging strategies
      2. Develop social media content ideas
      3. Write compelling product descriptions and marketing copy
      4. Suggest influencer partnerships and collaboration opportunities
      
      Focus on creating content that will resonate with the target audience and drive engagement.
    `,
    agent: contentCreator,
    expectedOutput: 'Complete content strategy with specific examples and recommendations',
  });

  return new Crew({
    agents: [marketAnalyst, contentCreator],
    tasks: [trendAnalysisTask, contentStrategyTask],
    verbose: true,
  });
}

// Main function to run the fashion recommendation crew
export async function runFashionRecommendationCrew(
  userPreferences: any,
  budget?: number
): Promise<any> {
  try {
    const crew = createFashionRecommendationCrew(userPreferences, budget);
    const result = await crew.kickoff();
    return result;
  } catch (error) {
    console.error('Fashion recommendation crew failed:', error);
    throw error;
  }
}

// Function to find cheaper alternatives
export async function findCheaperAlternatives(
  originalItem: any,
  targetPrice: number
): Promise<any> {
  try {
    const crew = createAlternativeFinderCrew(originalItem, targetPrice);
    const result = await crew.kickoff();
    return result;
  } catch (error) {
    console.error('Alternative finder crew failed:', error);
    throw error;
  }
}

// Function to run marketing analysis
export async function runMarketingAnalysis(
  targetAudience: string,
  productCategory: string
): Promise<any> {
  try {
    const crew = createMarketingAnalysisCrew(targetAudience, productCategory);
    const result = await crew.kickoff();
    return result;
  } catch (error) {
    console.error('Marketing analysis crew failed:', error);
    throw error;
  }
}
