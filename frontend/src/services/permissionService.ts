import api from './api';
import type { PermissionRequest, PermissionRequestInput, PermissionReviewInput } from '../types';

export const permissionService = {
  async requestAccess(data: PermissionRequestInput): Promise<PermissionRequest> {
    const response = await api.post('/users/permissions/request', data);
    return response.data as PermissionRequest;
  },

  async getMyRequests(): Promise<PermissionRequest[]> {
    const response = await api.get('/users/permissions/my');
    return response.data as PermissionRequest[];
  },

  async getAllRequests(): Promise<PermissionRequest[]> {
    const response = await api.get('/users/permissions/requests');
    return response.data as PermissionRequest[];
  },

  async reviewRequest(id: string, data: PermissionReviewInput): Promise<PermissionRequest> {
    const response = await api.patch(`/users/permissions/requests/${id}`, data);
    return response.data as PermissionRequest;
  },

  async revokeRequest(id: string): Promise<void> {
    await api.delete(`/users/permissions/requests/${id}`);
  },
};