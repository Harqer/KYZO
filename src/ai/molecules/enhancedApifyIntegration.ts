/**
 * MOLECULE: Enhanced Apify Integration
 * Atomic Design Pattern - Advanced Apify features for fashion AI
 */

import { ApifyClient } from 'apify-client';
import { AIConfiguration, ConfigAtom } from '../atoms/aiConfig';

export interface AppStoreRankingRequest {
  searchTerms: string[];
  countries: string[];
  maxResults: number;
  category?: string;
}

export interface AppStoreRankingResponse {
  appName: string;
  ranking: number;
  category: string;
  country: string;
  price: string;
  rating: number;
  reviews: number;
  developer: string;
  scrapedAt: string;
}

export interface VintedSearchRequest {
  mode: 'SEARCH' | 'CROSS_COUNTRY' | 'SELLER_PROFILE' | 'PRICE_TRACKING';
  query?: string;
  countries: string[];
  priceMin?: number;
  priceMax?: number;
  condition?: string;
  brand?: string;
  maxItems?: number;
}

export interface VintedItem {
  id: number;
  title: string;
  price: string;
  brand: string;
  condition: string;
  size: string;
  favourites: number;
  url: string;
  seller: string;
  country: string;
  scrapedAt: string;
}

export interface CrossCountryPriceComparison {
  item: string;
  prices: {
    country: string;
    price: number;
    currency: string;
    seller: string;
    availability: boolean;
  }[];
  arbitrageOpportunity: {
    minPrice: number;
    maxPrice: number;
    potentialProfit: number;
    profitPercentage: number;
    recommendedAction: string;
  };
}

// Enhanced Apify integration molecule
export class EnhancedApifyIntegration {
  private config: ConfigAtom;
  private client: ApifyClient;

  constructor() {
    this.config = AIConfiguration;
    this.client = new ApifyClient({
      token: this.config.getApiKey('apify'),
    });
  }

  // Molecule: Monitor fashion app store rankings
  async monitorFashionAppRankings(request: AppStoreRankingRequest): Promise<AppStoreRankingResponse[]> {
    try {
      const run = await this.client.actor('kazkn/apple-app-store-localization-scraper').call({
        searchTerms: request.searchTerms,
        countries: request.countries,
        maxResults: request.maxResults,
        category: request.category || 'Lifestyle',
      });

      const { items } = await this.client.dataset(run.defaultDatasetId).listItems();
      
      // Process and enhance ranking data
      const rankings = items.map((item, index) => ({
        appName: item.appName || item.title,
        ranking: index + 1,
        category: item.category || request.category || 'Lifestyle',
        country: item.country,
        price: item.price || 'Free',
        rating: parseFloat(item.rating) || 0,
        reviews: parseInt(item.reviews) || 0,
        developer: item.developer || item.seller,
        scrapedAt: new Date().toISOString(),
      }));

      return rankings;
    } catch (error) {
      console.error('Failed to monitor app store rankings:', error);
      return [];
    }
  }

  // Molecule: Search Vinted for fashion items
  async searchVintedFashion(request: VintedSearchRequest): Promise<VintedItem[]> {
    try {
      const run = await this.client.actor('kazkn/vinted-smart-scraper').call({
        mode: request.mode,
        query: request.query,
        countries: request.countries,
        priceMin: request.priceMin,
        priceMax: request.priceMax,
        condition: request.condition,
        brand: request.brand,
        maxItems: request.maxItems || 100,
      });

      const { items } = await this.client.dataset(run.defaultDatasetId).listItems();
      
      // Process and enhance Vinted data
      const vintedItems = items.map(item => ({
        id: item.id,
        title: item.title,
        price: item.price,
        brand: item.brand,
        condition: item.condition,
        size: item.size,
        favourites: item.favourites || 0,
        url: item.url,
        seller: item.seller,
        country: this.extractCountryFromUrl(item.url),
        scrapedAt: new Date().toISOString(),
      }));

      return vintedItems;
    } catch (error) {
      console.error('Failed to search Vinted:', error);
      return [];
    }
  }

  // Molecule: Cross-country price comparison
  async getCrossCountryPriceComparison(
    query: string, 
    countries: string[] = ['fr', 'de', 'es', 'it', 'nl', 'pl', 'uk']
  ): Promise<CrossCountryPriceComparison[]> {
    try {
      const searchRequest: VintedSearchRequest = {
        mode: 'CROSS_COUNTRY',
        query,
        countries,
        maxItems: 50,
      };

      const items = await this.searchVintedFashion(searchRequest);
      
      // Group items by title/brand for comparison
      const itemGroups = this.groupSimilarItems(items);
      
      // Calculate arbitrage opportunities
      const comparisons = itemGroups.map(group => ({
        item: group.title,
        prices: group.items.map(item => ({
          country: item.country,
          price: this.extractPrice(item.price),
          currency: this.extractCurrency(item.price),
          seller: item.seller,
          availability: true,
        })),
        arbitrageOpportunity: this.calculateArbitrageOpportunity(group.items),
      }));

      // Sort by profit potential
      return comparisons.sort((a, b) => 
        b.arbitrageOpportunity.profitPercentage - a.arbitrageOpportunity.profitPercentage
      );
    } catch (error) {
      console.error('Failed to get cross-country price comparison:', error);
      return [];
    }
  }

  // Molecule: Track competitor pricing
  async trackCompetitorPricing(
    competitorBrands: string[],
    countries: string[]
  ): Promise<{
    brand: string;
    averagePrice: number;
    priceRange: { min: number; max: number };
    itemCount: number;
    topSellers: string[];
    trendingItems: VintedItem[];
  }[]> {
    try {
      const competitorData = await Promise.all(
        competitorBrands.map(brand => 
          this.searchVintedFashion({
            mode: 'SEARCH',
            query: brand,
            countries,
            maxItems: 100,
          })
        )
      );

      return competitorData.map((items, index) => {
        const brand = competitorBrands[index];
        const prices = items.map(item => this.extractPrice(item.price)).filter(p => p > 0);
        
        return {
          brand,
          averagePrice: prices.reduce((sum, price) => sum + price, 0) / prices.length,
          priceRange: {
            min: Math.min(...prices),
            max: Math.max(...prices),
          },
          itemCount: items.length,
          topSellers: this.getTopSellers(items),
          trendingItems: items
            .sort((a, b) => b.favourites - a.favourites)
            .slice(0, 10),
        };
      });
    } catch (error) {
      console.error('Failed to track competitor pricing:', error);
      return [];
    }
  }

  // Molecule: Monitor price drops
  async monitorPriceDrops(
    queries: string[],
    countries: string[],
    threshold: number = 20
  ): Promise<{
    item: VintedItem;
    originalPrice: number;
    currentPrice: number;
    priceDrop: number;
    priceDropPercentage: number;
    recommendation: string;
  }[]> {
    try {
      // This would integrate with a price tracking system
      // For now, we'll simulate with current data
      const allItems = await Promise.all(
        queries.map(query => 
          this.searchVintedFashion({
            mode: 'SEARCH',
            query,
            countries,
            maxItems: 50,
          })
        )
      );

      const flatItems = allItems.flat();
      
      // Find items with significant price drops (simulated)
      const priceDrops = flatItems
        .filter(item => this.extractPrice(item.price) < 50) // Assume items under 50 are "dropped"
        .map(item => ({
          item,
          originalPrice: this.extractPrice(item.price) * 1.5, // Simulated original price
          currentPrice: this.extractPrice(item.price),
          priceDrop: this.extractPrice(item.price) * 0.5,
          priceDropPercentage: 33,
          recommendation: this.generatePriceDropRecommendation(item),
        }))
        .filter(drop => drop.priceDropPercentage >= threshold);

      return priceDrops.sort((a, b) => b.priceDropPercentage - a.priceDropPercentage);
    } catch (error) {
      console.error('Failed to monitor price drops:', error);
      return [];
    }
  }

  // Molecule: Trend detection from app rankings
  async detectFashionTrendsFromApps(
    appCategories: string[] = ['Fashion', 'Shopping', 'Lifestyle']
  ): Promise<{
    trend: string;
    confidence: number;
    relatedApps: string[];
    marketInsights: string[];
  }[]> {
    try {
      const rankingData = await Promise.all(
        appCategories.map(category => 
          this.monitorFashionAppRankings({
            searchTerms: ['fashion', 'style', 'shopping', 'clothing'],
            countries: ['us', 'gb', 'fr', 'de'],
            maxResults: 50,
            category,
          })
        )
      );

      const flatRankings = rankingData.flat();
      
      // Analyze trends based on app performance
      const trends = this.analyzeAppRankingTrends(flatRankings);
      
      return trends;
    } catch (error) {
      console.error('Failed to detect fashion trends from apps:', error);
      return [];
    }
  }

  // Helper methods
  private extractCountryFromUrl(url: string): string {
    const match = url.match(/vinted\.([a-z]{2})/);
    return match ? match[1] : 'unknown';
  }

  private extractPrice(priceString: string): number {
    const match = priceString.match(/[\d,.]+/);
    if (match) {
      return parseFloat(match[0].replace(',', '.'));
    }
    return 0;
  }

  private extractCurrency(priceString: string): string {
    const match = priceString.match(/[A-Z]{3}|[£$]/);
    return match ? match[0] : 'EUR';
  }

  private groupSimilarItems(items: VintedItem[]): { title: string; items: VintedItem[] }[] {
    const groups = new Map<string, VintedItem[]>();
    
    items.forEach(item => {
      const key = this.normalizeTitle(item.title);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    });

    return Array.from(groups.entries()).map(([title, items]) => ({ title, items }));
  }

  private normalizeTitle(title: string): string {
    return title.toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .trim();
  }

  private calculateArbitrageOpportunity(items: VintedItem[]): {
    minPrice: number;
    maxPrice: number;
    potentialProfit: number;
    profitPercentage: number;
    recommendedAction: string;
  } {
    const prices = items.map(item => this.extractPrice(item.price)).filter(p => p > 0);
    
    if (prices.length < 2) {
      return {
        minPrice: 0,
        maxPrice: 0,
        potentialProfit: 0,
        profitPercentage: 0,
        recommendedAction: 'Insufficient data for arbitrage analysis',
      };
    }

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const potentialProfit = maxPrice - minPrice;
    const profitPercentage = (potentialProfit / minPrice) * 100;

    let recommendedAction = 'Hold';
    if (profitPercentage > 50) {
      recommendedAction = 'Strong arbitrage opportunity - buy low, sell high';
    } else if (profitPercentage > 25) {
      recommendedAction = 'Moderate arbitrage opportunity - consider';
    } else if (profitPercentage > 10) {
      recommendedAction = 'Low arbitrage opportunity - monitor';
    }

    return {
      minPrice,
      maxPrice,
      potentialProfit,
      profitPercentage,
      recommendedAction,
    };
  }

  private getTopSellers(items: VintedItem[]): string[] {
    const sellerCounts = new Map<string, number>();
    
    items.forEach(item => {
      sellerCounts.set(item.seller, (sellerCounts.get(item.seller) || 0) + 1);
    });

    return Array.from(sellerCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([seller]) => seller);
  }

  private generatePriceDropRecommendation(item: VintedItem): string {
    const price = this.extractPrice(item.price);
    const favourites = item.favourites;
    
    if (favourites > 10) {
      return `Popular item with ${favourites} favorites - great deal opportunity`;
    } else if (item.condition === 'Neuf avec étiquette') {
      return 'Brand new item with significant price drop - excellent value';
    } else if (price < 30) {
      return 'Very low price point - consider for bulk purchasing';
    } else {
      return 'Good price drop opportunity - monitor for further decreases';
    }
  }

  private analyzeAppRankingTrends(rankings: AppStoreRankingResponse[]): {
    trend: string;
    confidence: number;
    relatedApps: string[];
    marketInsights: string[];
  }[] {
    // Analyze app rankings to identify fashion trends
    const trends = [];
    
    // Group apps by category and analyze ranking changes
    const categoryGroups = new Map<string, AppStoreRankingResponse[]>();
    
    rankings.forEach(ranking => {
      if (!categoryGroups.has(ranking.category)) {
        categoryGroups.set(ranking.category, []);
      }
      categoryGroups.get(ranking.category)!.push(ranking);
    });

    // Generate trend insights
    categoryGroups.forEach((apps, category) => {
      const topApps = apps
        .sort((a, b) => a.ranking - b.ranking)
        .slice(0, 5)
        .map(app => app.appName);

      const avgRating = apps.reduce((sum, app) => sum + app.rating, 0) / apps.length;
      
      trends.push({
        trend: `Growing ${category} app market with ${apps.length} active apps`,
        confidence: avgRating > 4.0 ? 0.8 : 0.6,
        relatedApps: topApps,
        marketInsights: [
          `Average rating: ${avgRating.toFixed(1)}`,
          `Top performing: ${topApps[0]}`,
          `Market size: ${apps.length} apps`,
        ],
      });
    });

    return trends.sort((a, b) => b.confidence - a.confidence);
  }
}

// Export molecule for composition
export { EnhancedApifyIntegration as EnhancedApifyMolecule };
