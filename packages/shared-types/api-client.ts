import ky from 'ky';
import type { 
  User,
  Portfolio,
  Asset,
  Category,
  PortfolioHistory,
  ExchangeRate,
  CreatePortfolioRequest,
  CreateAssetRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  DashboardData,
  AllocationData,
  RebalanceRecommendations,
  HistoricalPerformance
} from '@repo/shared-types';

const API_BASE_URL = typeof window !== 'undefined' 
  ? process.env.VITE_API_BASE_URL || '/api'
  : process.env.API_BASE_URL || 'http://localhost:8787/api';

export interface ApiClientOptions {
  baseUrl?: string;
  headers?: HeadersInit;
}

class ApiClient {
  private client;

  constructor(options: ApiClientOptions = {}) {
    const baseUrl = options.baseUrl || API_BASE_URL;
    
    this.client = ky.create({
      prefixUrl: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      hooks: {
        beforeError: [
          (error) => {
            console.error('API Error:', error);
            return error;
          }
        ]
      }
    });
  }

  // Authentication endpoints
  async login(email: string, password: string): Promise<{ success: boolean; token: string }> {
    return this.client.post('auth/login', { json: { email, password } }).json();
  }

  async logout(): Promise<void> {
    await this.client.post('auth/logout');
  }

  // User endpoints
  async getUserProfile(): Promise<User> {
    return this.client.get('users/profile').json();
  }

  async updateUserProfile(data: Partial<User>): Promise<User> {
    return this.client.put('users/profile', { json: data }).json();
  }

  // Portfolio endpoints
  async getPortfolios(): Promise<Portfolio[]> {
    return this.client.get('portfolios').json();
  }

  async createPortfolio(data: CreatePortfolioRequest): Promise<Portfolio> {
    return this.client.post('portfolios', { json: data }).json();
  }

  async getPortfolio(portfolioId: string): Promise<Portfolio> {
    return this.client.get(`portfolios/${portfolioId}`).json();
  }

  async updatePortfolio(portfolioId: string, data: Partial<Portfolio>): Promise<Portfolio> {
    return this.client.put(`portfolios/${portfolioId}`, { json: data }).json();
  }

  async deletePortfolio(portfolioId: string): Promise<void> {
    await this.client.delete(`portfolios/${portfolioId}`);
  }

  // Asset endpoints
  async getAssets(portfolioId: string): Promise<Asset[]> {
    return this.client.get(`portfolios/${portfolioId}/assets`).json();
  }

  async createAsset(portfolioId: string, data: CreateAssetRequest): Promise<Asset> {
    return this.client.post(`portfolios/${portfolioId}/assets`, { json: data }).json();
  }

  // Category endpoints
  async getCategories(portfolioId: string): Promise<Category[]> {
    return this.client.get(`portfolios/${portfolioId}/categories`).json();
  }

  async createCategory(portfolioId: string, data: CreateCategoryRequest): Promise<Category> {
    return this.client.post(`portfolios/${portfolioId}/categories`, { json: data }).json();
  }

  async updateCategory(categoryId: string, data: UpdateCategoryRequest): Promise<Category> {
    return this.client.put(`categories/${categoryId}`, { json: data }).json();
  }

  async deleteCategory(categoryId: string): Promise<void> {
    await this.client.delete(`categories/${categoryId}`);
  }

  // Dashboard endpoints
  async getDashboardData(portfolioId: string, displayCurrency?: string): Promise<DashboardData> {
    const params = displayCurrency ? { displayCurrency } : {};
    return this.client.get(`portfolios/${portfolioId}/dashboard`, { searchParams: params }).json();
  }

  // Allocation endpoints
  async getAllocationData(portfolioId: string, displayCurrency?: string): Promise<AllocationData> {
    const params = displayCurrency ? { displayCurrency } : {};
    return this.client.get(`portfolios/${portfolioId}/allocation`, { searchParams: params }).json();
  }

  // Rebalancing endpoints
  async getRebalanceRecommendations(portfolioId: string): Promise<RebalanceRecommendations> {
    return this.client.get(`portfolios/${portfolioId}/rebalance`).json();
  }

  // Historical performance endpoints
  async getHistoricalPerformance(
    portfolioId: string, 
    startDate: Date, 
    endDate: Date, 
    displayCurrency?: string
  ): Promise<HistoricalPerformance> {
    const params = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      ...(displayCurrency && { displayCurrency })
    };
    return this.client.get(`historical-performance/${portfolioId}`, { searchParams: params }).json();
  }

  // Exchange rates endpoints
  async getExchangeRates(baseCurrency?: string, date?: Date): Promise<ExchangeRate[]> {
    const params: Record<string, string> = {};
    if (baseCurrency) params.baseCurrency = baseCurrency;
    if (date) params.date = date.toISOString().split('T')[0];
    
    return this.client.get('exchange-rates', { searchParams: params }).json();
  }
}

// Singleton instance
let apiClient: ApiClient;

export function getApiClient(options: ApiClientOptions = {}) {
  if (!apiClient) {
    apiClient = new ApiClient(options);
  }
  return apiClient;
}

export default ApiClient;