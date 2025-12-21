import { clientFactory } from '../../../services/api/clientFactory';
import { endpoints } from '../../../services/api/endpoints';
import { adaptUserFromAPI, adaptUserToAPI } from '../../../services/api/adapters';
import { UserService } from './UserService';
import { User, CreateUserInput } from '../types';

const client = clientFactory();

export const userApiService: UserService = {
  async list(): Promise<User[]> {
    const response = await client.get(endpoints.users.list);
    return response.data.map(adaptUserFromAPI);
  },

  async get(id: string): Promise<User> {
    const response = await client.get(endpoints.users.get(id));
    return adaptUserFromAPI(response.data);
  },

  async create(input: CreateUserInput): Promise<User> {
    const response = await client.post(endpoints.users.create, adaptUserToAPI(input));
    return adaptUserFromAPI(response.data);
  },

  async update(id: string, input: Partial<CreateUserInput>): Promise<User> {
    const response = await client.put(endpoints.users.update(id), adaptUserToAPI(input));
    return adaptUserFromAPI(response.data);
  },

  async delete(id: string): Promise<void> {
    await client.delete(endpoints.users.delete(id));
  },
};
