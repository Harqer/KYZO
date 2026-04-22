/**
 * Fashion API Service - Backend Integration
 * Handles all fashion-related API calls including products, cart, orders, etc.
 */

import { apiService, ApiResponse } from './api';

// Fashion-specific types
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  original_price?: number;
  image: string;
  images?: string[];
  brand: string;
  category: string;
  subcategory?: string;
  rating: number;
  reviews_count: number;
  in_stock: boolean;
  stock_quantity?: number;
  tags?: string[];
  is_new?: boolean;
  discount?: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  parent_id?: string;
  product_count: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface CartItem {
  id: string;
  product_id: string;
  product: Product;
  quantity: number;
  size?: string;
  color?: string;
  added_at: string;
}

export interface Cart {
  id: string;
  user_id: string;
  items: CartItem[];
  total_amount: number;
  total_items: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  items: CartItem[];
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: Address;
  billing_address?: Address;
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  tracking_number?: string;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  type: 'shipping' | 'billing';
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title?: string;
  content: string;
  verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  product: Product;
  added_at: string;
}

export interface SearchFilters {
  category?: string;
  brand?: string;
  price_min?: number;
  price_max?: number;
  rating?: number;
  in_stock?: boolean;
  tags?: string[];
  sort_by?: 'name' | 'price' | 'rating' | 'created_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  products: Product[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
  filters: SearchFilters;
}

class FashionApiService {
  /**
   * Product endpoints
   */
  async getProducts(filters?: SearchFilters): Promise<ApiResponse<Product[]>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    
    const endpoint = `/products${params.toString() ? `?${params.toString()}` : ''}`;
    return apiService.makeRequest<Product[]>(endpoint);
  }

  async getProduct(id: string): Promise<ApiResponse<Product>> {
    return apiService.makeRequest<Product>(`/products/${id}`);
  }

  async getFeaturedProducts(limit: number = 10): Promise<ApiResponse<Product[]>> {
    return apiService.makeRequest<Product[]>(`/products/featured?limit=${limit}`);
  }

  async getNewArrivals(limit: number = 10): Promise<ApiResponse<Product[]>> {
    return apiService.makeRequest<Product[]>(`/products/new?limit=${limit}`);
  }

  async getRelatedProducts(productId: string, limit: number = 6): Promise<ApiResponse<Product[]>> {
    return apiService.makeRequest<Product[]>(`/products/${productId}/related?limit=${limit}`);
  }

  async searchProducts(query: string, filters?: SearchFilters): Promise<ApiResponse<SearchResult>> {
    const params = new URLSearchParams({ q: query });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    
    return apiService.makeRequest<SearchResult>(`/products/search?${params.toString()}`);
  }

  /**
   * Category endpoints
   */
  async getCategories(): Promise<ApiResponse<Category[]>> {
    return apiService.makeRequest<Category[]>('/categories');
  }

  async getCategory(id: string): Promise<ApiResponse<Category>> {
    return apiService.makeRequest<Category>(`/categories/${id}`);
  }

  async getCategoryProducts(categoryId: string, filters?: SearchFilters): Promise<ApiResponse<Product[]>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    
    return apiService.makeRequest<Product[]>(`/categories/${categoryId}/products?${params.toString()}`);
  }

  /**
   * Cart endpoints
   */
  async getCart(): Promise<ApiResponse<Cart>> {
    return apiService.makeRequest<Cart>('/cart');
  }

  async addToCart(productId: string, quantity: number = 1, size?: string, color?: string): Promise<ApiResponse<CartItem>> {
    return apiService.makeRequest<CartItem>('/cart/items', {
      method: 'POST',
      body: JSON.stringify({
        product_id: productId,
        quantity,
        size,
        color,
      }),
    });
  }

  async updateCartItem(itemId: string, quantity: number): Promise<ApiResponse<CartItem>> {
    return apiService.makeRequest<CartItem>(`/cart/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeFromCart(itemId: string): Promise<ApiResponse<void>> {
    return apiService.makeRequest<void>(`/cart/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  async clearCart(): Promise<ApiResponse<void>> {
    return apiService.makeRequest<void>('/cart/clear', {
      method: 'POST',
    });
  }

  /**
   * Wishlist endpoints
   */
  async getWishlist(): Promise<ApiResponse<WishlistItem[]>> {
    return apiService.makeRequest<WishlistItem[]>('/wishlist');
  }

  async addToWishlist(productId: string): Promise<ApiResponse<WishlistItem>> {
    return apiService.makeRequest<WishlistItem>('/wishlist', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId }),
    });
  }

  async removeFromWishlist(productId: string): Promise<ApiResponse<void>> {
    return apiService.makeRequest<void>(`/wishlist/${productId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Order endpoints
   */
  async getOrders(): Promise<ApiResponse<Order[]>> {
    return apiService.makeRequest<Order[]>('/orders');
  }

  async getOrder(id: string): Promise<ApiResponse<Order>> {
    return apiService.makeRequest<Order>(`/orders/${id}`);
  }

  async createOrder(orderData: Partial<Order>): Promise<ApiResponse<Order>> {
    return apiService.makeRequest<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async updateOrderStatus(id: string, status: Order['status']): Promise<ApiResponse<Order>> {
    return apiService.makeRequest<Order>(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  /**
   * Address endpoints
   */
  async getAddresses(): Promise<ApiResponse<Address[]>> {
    return apiService.makeRequest<Address[]>('/addresses');
  }

  async createAddress(addressData: Omit<Address, 'id' | 'user_id' | 'created_at'>): Promise<ApiResponse<Address>> {
    return apiService.makeRequest<Address>('/addresses', {
      method: 'POST',
      body: JSON.stringify(addressData),
    });
  }

  async updateAddress(id: string, addressData: Partial<Address>): Promise<ApiResponse<Address>> {
    return apiService.makeRequest<Address>(`/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(addressData),
    });
  }

  async deleteAddress(id: string): Promise<ApiResponse<void>> {
    return apiService.makeRequest<void>(`/addresses/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Review endpoints
   */
  async getProductReviews(productId: string): Promise<ApiResponse<Review[]>> {
    return apiService.makeRequest<Review[]>(`/products/${productId}/reviews`);
  }

  async createReview(productId: string, reviewData: Omit<Review, 'id' | 'user_id' | 'created_at' | 'verified_purchase' | 'helpful_count'>): Promise<ApiResponse<Review>> {
    return apiService.makeRequest<Review>(`/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  }

  async updateReview(id: string, reviewData: Partial<Review>): Promise<ApiResponse<Review>> {
    return apiService.makeRequest<Review>(`/reviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(reviewData),
    });
  }

  async deleteReview(id: string): Promise<ApiResponse<void>> {
    return apiService.makeRequest<void>(`/reviews/${id}`, {
      method: 'DELETE',
    });
  }

  async helpReview(id: string): Promise<ApiResponse<Review>> {
    return apiService.makeRequest<Review>(`/reviews/${id}/helpful`, {
      method: 'POST',
    });
  }

  /**
   * Webhook integration
   */
  async subscribeToWebhooks(events: string[]): Promise<ApiResponse<any>> {
    return apiService.makeRequest<any>('/webhooks/subscribe', {
      method: 'POST',
      body: JSON.stringify({ events }),
    });
  }

  async unsubscribeFromWebhooks(events: string[]): Promise<ApiResponse<void>> {
    return apiService.makeRequest<void>('/webhooks/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ events }),
    });
  }

  /**
   * Real-time updates (WebSocket/SSE)
   */
  async getRealtimeUpdates(): Promise<ApiResponse<any>> {
    return apiService.makeRequest<any>('/realtime/updates');
  }
}

// Export singleton instance
export const fashionApi = new FashionApiService();
