import express from 'express';
import { FashionAIService, FashionAIRequest, FashionAIResponse } from '../services/fashionAIService';
import { requireAuth } from '../config/clerk';
import { ApiResponse } from '../types';

const router = express.Router();
const fashionAI = new FashionAIService();

// Main AI search and recommendation endpoint
router.post('/search', requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const { query, userPreferences, budget, category, style, occasion } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      } as ApiResponse);
    }

    const request: FashionAIRequest = {
      query,
      userPreferences,
      budget,
      category,
      style,
      occasion,
    };

    const result = await fashionAI.processFashionRequest(request);

    if (result.error) {
      return res.status(500).json({
        success: false,
        error: result.error,
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: result,
    } as ApiResponse);
  } catch (error) {
    console.error('Fashion AI search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse);
  }
});

// Get personalized recommendations
router.get('/recommendations/:userId', requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      } as ApiResponse);
    }

    const recommendations = await fashionAI.getPersonalizedRecommendations(userId);

    res.json({
      success: true,
      data: {
        recommendations,
        count: recommendations.length,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Personalized recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse);
  }
});

// Generate outfit suggestions
router.post('/outfit-suggestions', requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const { userId, occasion, style, budget } = req.body;

    if (!userId || !occasion || !style) {
      return res.status(400).json({
        success: false,
        error: 'User ID, occasion, and style are required',
      } as ApiResponse);
    }

    const suggestions = await fashionAI.generateOutfitSuggestions(userId, occasion, style, budget);

    res.json({
      success: true,
      data: {
        suggestions,
        occasion,
        style,
        budget,
        count: suggestions.length,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Outfit suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse);
  }
});

// Find cheaper alternatives
router.post('/alternatives', requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const { originalItem, targetPrice } = req.body;

    if (!originalItem || !targetPrice) {
      return res.status(400).json({
        success: false,
        error: 'Original item and target price are required',
      } as ApiResponse);
    }

    const alternatives = await fashionAI.findCheaperAlternatives(originalItem, targetPrice);

    res.json({
      success: true,
      data: {
        originalItem,
        targetPrice,
        alternatives,
        count: alternatives.length,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Alternatives search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse);
  }
});

// Get marketing insights
router.post('/marketing-insights', requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const { targetAudience, productCategory } = req.body;

    if (!targetAudience || !productCategory) {
      return res.status(400).json({
        success: false,
        error: 'Target audience and product category are required',
      } as ApiResponse);
    }

    const insights = await fashionAI.generateMarketingInsights(targetAudience, productCategory);

    if (insights.error) {
      return res.status(500).json({
        success: false,
        error: insights.error,
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: {
        insights,
        targetAudience,
        productCategory,
        count: Array.isArray(insights) ? insights.length : 0,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Marketing insights error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse);
  }
});

// Monitor price changes
router.post('/price-monitor', requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const { itemIds } = req.body;

    if (!itemIds || !Array.isArray(itemIds)) {
      return res.status(400).json({
        success: false,
        error: 'Item IDs array is required',
      } as ApiResponse);
    }

    const priceUpdates = await fashionAI.monitorPriceChanges(itemIds);

    res.json({
      success: true,
      data: {
        priceUpdates,
        count: priceUpdates.length,
        lastChecked: new Date().toISOString(),
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Price monitoring error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse);
  }
});

// Get AI status and capabilities
router.get('/status', requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    res.json({
      success: true,
      data: {
        aiFeatures: {
          langGraph: {
            status: 'active',
            capabilities: ['web_search', 'price_comparison', 'recommendations', 'marketing_insights'],
          },
          langChain: {
            status: 'active',
            capabilities: ['vector_search', 'embeddings', 'personalization'],
          },
          crewAI: {
            status: 'active',
            capabilities: ['fashion_stylist', 'market_analyst', 'personal_shopper', 'content_creator'],
          },
          pinecone: {
            status: 'active',
            capabilities: ['vector_storage', 'similarity_search', 'metadata_filtering'],
          },
        },
        endpoints: {
          search: 'POST /api/fashion-ai/search',
          recommendations: 'GET /api/fashion-ai/recommendations/:userId',
          outfitSuggestions: 'POST /api/fashion-ai/outfit-suggestions',
          alternatives: 'POST /api/fashion-ai/alternatives',
          marketingInsights: 'POST /api/fashion-ai/marketing-insights',
          priceMonitor: 'POST /api/fashion-ai/price-monitor',
        },
        version: '1.0.0',
      },
    } as ApiResponse);
  } catch (error) {
    console.error('AI status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse);
  }
});

export default router;
