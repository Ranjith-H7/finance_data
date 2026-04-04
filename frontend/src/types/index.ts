export type UserRole = 'admin' | 'analyst' | 'viewer';
export type UserStatus = 'active' | 'inactive';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt?: string;
}

export interface FinanceRecord {
  _id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  note?: string;
  description?: string;
  paymentMethod?: 'UPI' | 'CASH' | 'CARD';
  merchant?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardAnalytics {
  summary: {
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
    totalRecords: number;
    totalUsers: number;
    averageAmount: number;
    minAmount: number;
    maxAmount: number;
  };
  byType: Array<{ _id: 'income' | 'expense'; count: number; totalAmount: number }>;
  byCategory: Array<{ _id: string; count: number; totalAmount: number }>;
  monthlyTrends: Array<{
    year: number;
    month: number;
    income: number;
    expense: number;
    net: number;
  }>;
  recentActivity: FinanceRecord[];
  topSpenders: Array<{
    userId: string;
    name: string;
    email: string;
    totalExpense: number;
    totalIncome: number;
  }>;
  lowestSpenders: Array<{
    userId: string;
    name: string;
    email: string;
    totalExpense: number;
    totalIncome: number;
  }>;
  userBreakdown: Array<{
    userId: string;
    name: string;
    email: string;
    totalIncome: number;
    totalExpense: number;
    totalAmount: number;
    totalRecords: number;
    averageAmount: number;
    minAmount: number;
    maxAmount: number;
  }>;
  permissionRequired?: boolean;
  accessScope?: 'all' | 'permitted' | 'none';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type PermissionScope = 'single_user' | 'all_users';
export type PermissionStatus = 'pending' | 'approved' | 'rejected';

export interface PermissionRequest {
  _id: string;
  analystId: string;
  scope: PermissionScope;
  userId?: string;
  reason?: string;
  status: PermissionStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PermissionRequestInput {
  scope: PermissionScope;
  userId?: string;
  reason?: string;
}

export interface PermissionReviewInput {
  status: 'approved' | 'rejected';
}

export interface ApiError {
  message?: string;
}
