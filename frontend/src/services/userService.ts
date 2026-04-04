import api from './api';
import type { User } from '../types';

export const userService = {
  async getAllUsers(): Promise<User[]> {
    const response = await api.get('/users');
    return response.data as User[];
  },

  async searchUsers(query: string): Promise<User[]> {
    const response = await api.get('/users/search', {
      params: query.trim() ? { q: query.trim() } : undefined,
    });
    return response.data as User[];
  },

  async updateUser(id: string, data: Partial<Pick<User, 'role' | 'status'>>): Promise<User> {
    const response = await api.patch(`/users/manage/${id}`, data);
    return response.data as User;
  },

  async createUser(data: { name: string; email: string; password: string; role: User['role']; status?: User['status'] }): Promise<User> {
    const response = await api.post('/users/create', data);
    return response.data as User;
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/manage/${id}`);
  },
};
