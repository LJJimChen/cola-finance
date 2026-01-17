// API Client Types generated from OpenAPI spec

// Import the types from the types package
import { 
  User, 
  Asset, 
  Category, 
  ExchangeRate, 
  PortfolioHistory,
  UserUpdateRequest,
  AssetCreateRequest,
  AssetUpdateRequest,
  CategoryCreateRequest,
  CategoryUpdateRequest
} from '@cola-finance/types';

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// API Request/Response Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface GetAssetsQuery {
  category?: string;
  broker?: string;
}

export interface GetDashboardQuery {
  currency?: string;
}

export interface GetPortfolioQuery {
  currency?: string;
}

export interface GetRebalanceQuery {
  currency?: string;
}

export interface GetExchangeRatesQuery {
  from?: string;
  to?: string;
  date?: string; // YYYY-MM-DD format
}

export interface GetPortfolioHistoryQuery {
  startDate: string; // YYYY-MM-DD format
  endDate: string;   // YYYY-MM-DD format
  currency?: string;
}

// Dashboard-specific types
export interface AssetAllocation {
  categoryId: string;
  categoryName: string;
  percentage: number;
  value: number;
}

export interface Transaction {
  id: string;
  assetId: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  total: number;
  date: string; // ISO date string
}

export interface DashboardData {
  totalAssets: number;
  dailyGainLoss: number;
  annualReturn: number;
  assetAllocation: AssetAllocation[];
  recentTransactions: Transaction[];
}

// Portfolio-specific types
export interface PortfolioCategory {
  id: string;
  name: string;
  targetAllocation: number;
  currentValue: number;
  currentPercentage: number;
  assets: Asset[];
}

export interface PortfolioData {
  totalValue: number;
  categories: PortfolioCategory[];
}

// Rebalance-specific types
export interface RebalanceItem {
  categoryId: string;
  categoryName: string;
  currentAllocation: number;
  targetAllocation: number;
  deviation: number;
  recommendation: string;
}

export interface RebalanceSummary {
  totalDeviation: number;
  status: 'balanced' | 'slightly_unbalanced' | 'moderately_unbalanced' | 'highly_unbalanced';
}

export interface RebalanceRecommendations {
  recommendations: RebalanceItem[];
  summary: RebalanceSummary;
}

// API Client Interface
export interface ApiClient {
  // Auth endpoints
  login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>>;
  logout(): Promise<ApiResponse<void>>;

  // User endpoints
  getUserProfile(): Promise<ApiResponse<User>>;
  updateUserProfile(updateData: UserUpdateRequest): Promise<ApiResponse<User>>;

  // Asset endpoints
  getAssets(query?: GetAssetsQuery): Promise<ApiResponse<Asset[]>>;
  getAssetById(assetId: string): Promise<ApiResponse<Asset>>;
  createAsset(assetData: AssetCreateRequest): Promise<ApiResponse<Asset>>;
  updateAsset(assetId: string, updateData: AssetUpdateRequest): Promise<ApiResponse<Asset>>;
  deleteAsset(assetId: string): Promise<ApiResponse<void>>;

  // Category endpoints
  getCategories(): Promise<ApiResponse<Category[]>>;
  getCategoryById(categoryId: string): Promise<ApiResponse<Category>>;
  createCategory(categoryData: CategoryCreateRequest): Promise<ApiResponse<Category>>;
  updateCategory(categoryId: string, updateData: CategoryUpdateRequest): Promise<ApiResponse<Category>>;
  deleteCategory(categoryId: string): Promise<ApiResponse<void>>;

  // Dashboard endpoints
  getDashboard(query?: GetDashboardQuery): Promise<ApiResponse<DashboardData>>;

  // Portfolio endpoints
  getPortfolio(query?: GetPortfolioQuery): Promise<ApiResponse<PortfolioData>>;

  // Rebalance endpoints
  getRebalance(query?: GetRebalanceQuery): Promise<ApiResponse<RebalanceRecommendations>>;

  // Exchange rates endpoints
  getExchangeRates(query?: GetExchangeRatesQuery): Promise<ApiResponse<ExchangeRate[]>>;

  // History endpoints
  getPortfolioHistory(query: GetPortfolioHistoryQuery): Promise<ApiResponse<PortfolioHistory[]>>;
}