import { apiClient } from '../../../services/api/client';
import { API_ENDPOINTS } from '../../../services/api/endpoints';
import { adaptUserFromAPI, adaptUserToAPI } from '../../../services/api/adapters';
import { UserService } from './UserService';
import { User, CreateUserInput } from '../types';

export const userApiService: UserService = {
  async list(): Promise<User[]> {
    const response = await apiClient.get(API_ENDPOINTS.USERS);
    return response.data.map(adaptUserFromAPI);
  },

  async get(id: string): Promise<User> {
    const response = await apiClient.get(`${API_ENDPOINTS.USERS}/${id}`);
    return adaptUserFromAPI(response.data);
  },

  async create(input: CreateUserInput): Promise<User> {
    const response = await apiClient.post(API_ENDPOINTS.USERS, adaptUserToAPI(input));
    return adaptUserFromAPI(response.data);
  },

  async update(id: string, input: Partial<CreateUserInput>): Promise<User> {
    const response = await apiClient.put(`${API_ENDPOINTS.USERS}/${id}`, adaptUserToAPI(input));
    return adaptUserFromAPI(response.data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`${API_ENDPOINTS.USERS}/${id}`);
  },
};
