import api from './api';
import type { DashboardAnalytics, FinanceRecord } from '../types';

export interface FinanceRecordFilters {
  userId?: string;
  type?: 'income' | 'expense';
  category?: string;
  startDate?: string;
  endDate?: string;
}

export const financeService = {
  async createRecord(data: Partial<FinanceRecord>): Promise<FinanceRecord> {
    const response = await api.post('/users/finance/create', data);
    return response.data as FinanceRecord;
  },

  async getAllRecords(filters?: FinanceRecordFilters): Promise<FinanceRecord[]> {
    const response = await api.get('/users/finance', {
      params: filters,
    });
    return response.data as FinanceRecord[];
  },

  async getMyRecords(): Promise<FinanceRecord[]> {
    const response = await api.get('/users/finance/my');
    return response.data as FinanceRecord[];
  },

  async updateRecord(id: string, data: Partial<FinanceRecord>): Promise<FinanceRecord> {
    const response = await api.put(`/users/finance/${id}`, data);
    return response.data as FinanceRecord;
  },

  async deleteRecord(id: string): Promise<void> {
    await api.delete(`/users/finance/${id}`);
  },

  async getDashboardAnalytics(filters?: FinanceRecordFilters): Promise<DashboardAnalytics> {
    const response = await api.get('/users/finance/analytics', {
      params: filters,
    });
    return response.data as DashboardAnalytics;
  },
};
