/**
 * Webhook Service - Real-time Backend Integration
 * Handles webhook subscriptions and real-time updates from the backend
 */

import { apiService, ApiResponse } from './api';

export interface WebhookEvent {
  event: string;
  data: any;
  timestamp: string;
  user_id?: string;
}

export interface WebhookSubscription {
  id: string;
  event: string;
  endpoint: string;
  active: boolean;
  created_at: string;
}

export interface RealtimeUpdate {
  type: 'cart_update' | 'order_status' | 'product_update' | 'inventory_change' | 'price_change';
  data: any;
  timestamp: string;
}

class WebhookService {
  private eventHandlers: Map<string, ((data: any) => void)[]> = new Map();
  private wsConnection: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  /**
   * Subscribe to webhook events
   */
  async subscribeToEvents(events: string[]): Promise<ApiResponse<WebhookSubscription[]>> {
    try {
      const response = await apiService.makeRequest<WebhookSubscription[]>('/webhooks/subscribe', {
        method: 'POST',
        body: JSON.stringify({ events }),
      });

      // Set up event handlers for each subscribed event
      events.forEach(event => {
        this.registerEventHandler(event, this.handleWebhookEvent.bind(this));
      });

      // Initialize WebSocket connection for real-time updates
      this.initializeWebSocket();

      return response;
    } catch (error) {
      console.error('Failed to subscribe to webhook events:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from webhook events
   */
  async unsubscribeFromEvents(events: string[]): Promise<ApiResponse<void>> {
    try {
      const response = await apiService.makeRequest<void>('/webhooks/unsubscribe', {
        method: 'POST',
        body: JSON.stringify({ events }),
      });

      // Remove event handlers
      events.forEach(event => {
        this.eventHandlers.delete(event);
      });

      return response;
    } catch (error) {
      console.error('Failed to unsubscribe from webhook events:', error);
      throw error;
    }
  }

  /**
   * Register event handler for specific event type
   */
  registerEventHandler(event: string, handler: (data: any) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  /**
   * Remove event handler for specific event type
   */
  removeEventHandler(event: string, handler: (data: any) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
      if (handlers.length === 0) {
        this.eventHandlers.delete(event);
      }
    }
  }

  /**
   * Initialize WebSocket connection for real-time updates
   */
  private initializeWebSocket(): void {
    const wsUrl = `${apiService.getBaseUrl().replace('http', 'ws')}/ws`;
    
    try {
      this.wsConnection = new WebSocket(wsUrl);
      
      this.wsConnection.onopen = () => {
        console.log('WebSocket connection established');
        this.reconnectAttempts = 0;
      };
      
      this.wsConnection.onmessage = (event) => {
        try {
          const update: RealtimeUpdate = JSON.parse(event.data);
          this.handleRealtimeUpdate(update);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      this.wsConnection.onclose = () => {
        console.log('WebSocket connection closed');
        this.attemptReconnect();
      };
      
      this.wsConnection.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  }

  /**
   * Attempt to reconnect WebSocket
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.initializeWebSocket();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  /**
   * Handle incoming webhook events
   */
  private handleWebhookEvent(event: WebhookEvent): void {
    const handlers = this.eventHandlers.get(event.event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event.data);
        } catch (error) {
          console.error(`Error handling webhook event ${event.event}:`, error);
        }
      });
    }
  }

  /**
   * Handle real-time updates from WebSocket
   */
  private handleRealtimeUpdate(update: RealtimeUpdate): void {
    const handlers = this.eventHandlers.get(update.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(update.data);
        } catch (error) {
          console.error(`Error handling realtime update ${update.type}:`, error);
        }
      });
    }
  }

  /**
   * Close WebSocket connection
   */
  closeConnection(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): 'connected' | 'disconnected' | 'connecting' {
    if (!this.wsConnection) return 'disconnected';
    
    switch (this.wsConnection.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'disconnected';
    }
  }

  /**
   * Send message through WebSocket
   */
  sendMessage(message: any): boolean {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify(message));
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const webhookService = new WebhookService();
