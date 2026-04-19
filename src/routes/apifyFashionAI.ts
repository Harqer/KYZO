import express from 'express';
import { FashionWebScraper } from '../ai/apify/fashionWebScraper';
import { FashionAIService } from '../services/fashionAIService';
import { requireAuth } from '../config/clerk';
import { ApiResponse } from '../types';

const router = express.Router();
const fashionWebScraper = new FashionWebScraper();

// Enhanced fashion search with Apify scraping
router.post('/scrape-fashion', requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const { 
      searchQuery, 
      retailers, 
      categories, 
      budgetRange, 
      brands, 
      excludeKeywords 
    } = req.body;

    if (!searchQuery) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      } as ApiResponse);
    }

    const scrapingRequest = {
      searchQuery,
      retailers,
      categories,
      budgetRange,
      brands,
      excludeKeywords,
    };

    const scrapingResult = await fashionWebScraper.scrapeFashionItems(scrapingRequest);

    res.json({
      success: true,
      data: {
        scrapedItems: scrapingResult.items,
        totalItems: scrapingResult.totalItems,
        retailers: scrapingResult.retailers,
        averagePrice: scrapingResult.averagePrice,
        priceRange: scrapingResult.priceRange,
        scrapedAt: scrapingResult.scrapedAt,
        metadata: scrapingResult.metadata,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Fashion scraping error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse);
  }
});

// Price monitoring with Apify
router.post('/monitor-prices', requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const { itemIds } = req.body;

    if (!itemIds || !Array.isArray(itemIds)) {
      return res.status(400).json({
        success: false,
        error: 'Item IDs array is required',
      } as ApiResponse);
    }

    const priceUpdates = await fashionWebScraper.monitorPriceChanges(itemIds);

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

// Competitor analysis with Apify
router.post('/analyze-competitors', requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const { competitors, category } = req.body;

    if (!competitors || !Array.isArray(competitors)) {
      return res.status(400).json({
        success: false,
        error: 'Competitors array is required',
      } as ApiResponse);
    }

    const competitorAnalysis = await fashionWebScraper.analyzeCompetitors(competitors, category);

    res.json({
      success: true,
      data: {
        competitorAnalysis,
        category,
        analyzedAt: new Date().toISOString(),
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Competitor analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse);
  }
});

// Trend analysis with Apify
router.post('/analyze-trends', requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const { keywords } = req.body;

    if (!keywords || !Array.isArray(keywords)) {
      return res.status(400).json({
        success: false,
        error: 'Keywords array is required',
      } as ApiResponse);
    }

    const trendAnalysis = await fashionWebScraper.analyzeFashionTrends(keywords);

    res.json({
      success: true,
      data: {
        trendAnalysis,
        keywords,
        analyzedAt: new Date().toISOString(),
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Trend analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse);
  }
});

// Combined AI + Apify search for comprehensive intelligence
router.post('/intelligent-search', requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const { 
      query, 
      userPreferences, 
      budget, 
      category, 
      style, 
      occasion,
      useApifyScraping = true 
    } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      } as ApiResponse);
    }

    let result;
    
    if (useApifyScraping) {
      // Step 1: Scrape real-time data with Apify
      const scrapingRequest = {
        searchQuery: query,
        retailers: userPreferences?.preferredRetailers,
        categories: [category],
        budgetRange: budget ? { min: 0, max: budget } : undefined,
        brands: userPreferences?.preferredBrands,
        excludeKeywords: userPreferences?.excludeKeywords,
      };

      const scrapingResult = await fashionWebScraper.scrapeFashionItems(scrapingRequest);
      
      // Step 2: Enhance scraped data with our AI analysis
      const aiRequest = {
        query,
        userPreferences,
        budget,
        category,
        style,
        occasion,
      };

      const enhancedResult = await fashionWebScraper.integrateWithAI(scrapingResult, aiRequest);
      
      result = enhancedResult;
    } else {
      // Fallback to existing AI system
      const fashionAIService = new FashionAIService();
      result = await fashionAIService.processFashionRequest({
        query,
        userPreferences,
        budget,
        category,
        style,
        occasion,
      });
    }

    res.json({
      success: true,
      data: result,
    } as ApiResponse);
  } catch (error) {
    console.error('Intelligent search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse);
  }
});

// Real-time market intelligence
router.post('/market-intelligence', requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const { targetAudience, productCategory, timeRange } = req.body;

    if (!targetAudience || !productCategory) {
      return res.status(400).json({
        success: false,
        error: 'Target audience and product category are required',
      } as ApiResponse);
    }

    // Get comprehensive market intelligence
    const [competitorAnalysis, trendAnalysis] = await Promise.all([
      fashionWebScraper.analyzeCompetitors(
        ['nike', 'adidas', 'zara', 'hm'], 
        productCategory
      ),
      fashionWebScraper.analyzeFashionTrends(
        ['streetwear', 'athleisure', 'sustainable_fashion', 'vintage']
      ),
    ]);

    // Generate market insights using our AI
    const fashionAIService = new FashionAIService();
    const aiInsights = await fashionAIService.generateMarketingInsights(targetAudience, productCategory);

    res.json({
      success: true,
      data: {
        competitorAnalysis,
        trendAnalysis,
        aiInsights,
        targetAudience,
        productCategory,
        timeRange,
        generatedAt: new Date().toISOString(),
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Market intelligence error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse);
  }
});

// Automated deal finder
router.post('/find-deals', requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const { 
      searchQuery, 
      maxPrice, 
      brands, 
      categories,
      minDiscount = 20 
    } = req.body;

    if (!searchQuery) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      } as ApiResponse);
    }

    // Scrape for deals across multiple retailers
    const scrapingRequest = {
      searchQuery,
      retailers: brands || ['nike.com', 'adidas.com', 'zara.com', 'hm.com', 'uniqlo.com'],
      categories,
      budgetRange: { min: 0, max: maxPrice },
      brands,
      excludeKeywords: ['full price', 'expensive'],
    };

    const scrapingResult = await fashionWebScraper.scrapeFashionItems(scrapingRequest);
    
    // Filter and sort by best deals
    const deals = scrapingResult.items
      .filter(item => item.discount && item.discount >= minDiscount)
      .sort((a, b) => (a.discount || 0) - (b.discount || 0))
      .slice(0, 20);

    res.json({
      success: true,
      data: {
        deals,
        totalDeals: deals.length,
        maxDiscount: Math.max(...deals.map(d => d.discount || 0)),
        averageDiscount: deals.reduce((sum, d) => sum + (d.discount || 0), 0) / deals.length,
        scrapedAt: scrapingResult.scrapedAt,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Deal finder error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse);
  }
});

// Get Apify scraping status
router.get('/scraping-status', requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    res.json({
      success: true,
      data: {
        apifyIntegration: {
          status: 'active',
          capabilities: [
            'web_scraping',
            'price_monitoring',
            'competitor_analysis',
            'trend_analysis',
            'real_time_data',
            'deal_finding',
          ],
          supportedRetailers: [
            'nike.com', 'adidas.com', 'zara.com', 'hm.com', 
            'uniqlo.com', 'puma.com', 'new balance.com'
          ],
          supportedCategories: [
            'clothing', 'shoes', 'accessories', 'streetwear',
            'athleisure', 'sustainable_fashion'
          ],
        },
        endpoints: {
          scrapeFashion: 'POST /api/apify-fashion/scrape-fashion',
          monitorPrices: 'POST /api/apify-fashion/monitor-prices',
          analyzeCompetitors: 'POST /api/apify-fashion/analyze-competitors',
          analyzeTrends: 'POST /api/apify-fashion/analyze-trends',
          intelligentSearch: 'POST /api/apify-fashion/intelligent-search',
          marketIntelligence: 'POST /api/apify-fashion/market-intelligence',
          findDeals: 'POST /api/apify-fashion/find-deals',
          scrapingStatus: 'GET /api/apify-fashion/scraping-status',
        },
        version: '1.0.0',
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Scraping status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse);
  }
});

export default router;
