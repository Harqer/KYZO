import express from 'express';
import { requireAuth } from '../middleware/auth';
import { LangChainService } from '../config/langchain';
import { PineconeService } from '../config/pinecone';
import { RedisService, CacheKeys } from '../config/redis';

const router = express.Router();

/**
 * Generate fashion recommendations
 * POST /api/ai/recommendations
 */
router.post('/recommendations', requireAuth, async (req, res) => {
  try {
    const { preferences, occasion, season } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Check cache first
    const cacheKey = CacheKeys.fashionRecommendations(userId);
    const cachedRecommendations = await RedisService.get(cacheKey);
    
    if (cachedRecommendations) {
      return res.json({
        success: true,
        data: cachedRecommendations,
        cached: true,
      });
    }

    const recommendations = await LangChainService.generateFashionRecommendations(
      preferences,
      occasion,
      season
    );

    // Cache for 1 hour
    await RedisService.set(cacheKey, recommendations, { ttl: 3600 });

    await LangChainService.logToLangSmith(
      'fashion_recommendations',
      { preferences, occasion, season, userId },
      { recommendations }
    );

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error('Failed to generate recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate recommendations',
    });
  }
});

/**
 * Analyze fashion image
 * POST /api/ai/analyze-image
 */
router.post('/analyze-image', requireAuth, async (req, res) => {
  try {
    const { imageUrl, description } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'Image URL is required',
      });
    }

    const analysis = await LangChainService.analyzeFashionImage(imageUrl, description);

    await LangChainService.logToLangSmith(
      'fashion_image_analysis',
      { imageUrl, description, userId },
      { analysis }
    );

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Failed to analyze image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze image',
    });
  }
});

/**
 * Generate outfit combinations
 * POST /api/ai/outfit-combinations
 */
router.post('/outfit-combinations', requireAuth, async (req, res) => {
  try {
    const { wardrobeItems, preferences } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (!wardrobeItems || !Array.isArray(wardrobeItems)) {
      return res.status(400).json({
        success: false,
        error: 'Wardrobe items array is required',
      });
    }

    const combinations = await LangChainService.generateOutfitCombinations(
      wardrobeItems,
      preferences
    );

    await LangChainService.logToLangSmith(
      'outfit_combinations',
      { wardrobeItems, preferences, userId },
      { combinations }
    );

    res.json({
      success: true,
      data: combinations,
    });
  } catch (error) {
    console.error('Failed to generate outfit combinations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate outfit combinations',
    });
  }
});

/**
 * Get fashion advice
 * POST /api/ai/advice
 */
router.post('/advice', requireAuth, async (req, res) => {
  try {
    const { query, userContext } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      });
    }

    const advice = await LangChainService.getFashionAdvice(query, userContext);

    await LangChainService.logToLangSmith(
      'fashion_advice',
      { query, userContext, userId },
      { advice }
    );

    res.json({
      success: true,
      data: advice,
    });
  } catch (error) {
    console.error('Failed to get fashion advice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get fashion advice',
    });
  }
});

/**
 * Generate style tags
 * POST /api/ai/style-tags
 */
router.post('/style-tags', requireAuth, async (req, res) => {
  try {
    const { itemName, description, category } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (!itemName || !description || !category) {
      return res.status(400).json({
        success: false,
        error: 'Item name, description, and category are required',
      });
    }

    const tags = await LangChainService.generateStyleTags(itemName, description, category);

    res.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    console.error('Failed to generate style tags:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate style tags',
    });
  }
});

/**
 * Create look description
 * POST /api/ai/look-description
 */
router.post('/look-description', requireAuth, async (req, res) => {
  try {
    const { items, style, occasion } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (!items || !Array.isArray(items) || !style) {
      return res.status(400).json({
        success: false,
        error: 'Items array and style are required',
      });
    }

    const description = await LangChainService.createLookDescription(items, style, occasion);

    await LangChainService.logToLangSmith(
      'look_description',
      { items, style, occasion, userId },
      { description }
    );

    res.json({
      success: true,
      data: description,
    });
  } catch (error) {
    console.error('Failed to create look description:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create look description',
    });
  }
});

/**
 * Search similar items using vector search
 * POST /api/ai/similar-items
 */
router.post('/similar-items', requireAuth, async (req, res) => {
  try {
    const { queryVector, topK = 10, filter } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (!queryVector || !Array.isArray(queryVector)) {
      return res.status(400).json({
        success: false,
        error: 'Query vector is required',
      });
    }

    // Add user filter to ensure only user's items are searched
    const searchFilter = {
      userId,
      ...filter,
    };

    const similarItems = await PineconeService.searchSimilar(
      queryVector,
      topK,
      searchFilter
    );

    res.json({
      success: true,
      data: similarItems,
    });
  } catch (error) {
    console.error('Failed to search similar items:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search similar items',
    });
  }
});

/**
 * Get AI usage statistics
 * GET /api/ai/stats
 */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Get usage stats from Redis or database
    const stats = {
      recommendationsGenerated: await RedisService.get(`ai_stats:${userId}:recommendations`) || 0,
      imagesAnalyzed: await RedisService.get(`ai_stats:${userId}:images`) || 0,
      adviceGiven: await RedisService.get(`ai_stats:${userId}:advice`) || 0,
      combinationsGenerated: await RedisService.get(`ai_stats:${userId}:combinations`) || 0,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Failed to get AI stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get AI statistics',
    });
  }
});

export default router;
