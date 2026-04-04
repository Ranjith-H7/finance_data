import api from './api';
import type { AuthResponse, LoginCredentials, User } from '../types';

const USER_STORAGE_KEY = 'user';
const TOKEN_STORAGE_KEY = 'token';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/users/login', credentials);
    localStorage.setItem(TOKEN_STORAGE_KEY, response.data.token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.data.user));
    return response.data as AuthResponse;
  },

  async register(credentials: { name: string; email: string; password: string }): Promise<AuthResponse> {
    const response = await api.post('/users/register', credentials);
    localStorage.setItem(TOKEN_STORAGE_KEY, response.data.token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.data.user));
    return response.data as AuthResponse;
  },

  logout(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  },

  getCurrentUser(): User | null {
    const rawUser = localStorage.getItem(USER_STORAGE_KEY);
    return rawUser ? (JSON.parse(rawUser) as User) : null;
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  },

  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  },
};
