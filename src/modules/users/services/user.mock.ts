import { UserService } from './UserService';
import { User, CreateUserInput } from '../types';
import { mockDelay, mockUsers } from '../../../services/mock';

export const userMockService: UserService = {
  async list(): Promise<User[]> {
    await mockDelay();
    return [...mockUsers];
  },

  async get(id: string): Promise<User> {
    await mockDelay();
    const user = mockUsers.find(u => u.id === id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    return user;
  },

  async create(input: CreateUserInput): Promise<User> {
    await mockDelay();
    const newUser: User = {
      id: crypto.randomUUID(),
      ...input,
    };
    mockUsers.push(newUser);
    return newUser;
  },

  async update(id: string, input: Partial<CreateUserInput>): Promise<User> {
    await mockDelay();
    const userIndex = mockUsers.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error(`User with id ${id} not found`);
    }
    mockUsers[userIndex] = { ...mockUsers[userIndex], ...input };
    return mockUsers[userIndex];
  },

  async delete(id: string): Promise<void> {
    await mockDelay();
    const userIndex = mockUsers.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error(`User with id ${id} not found`);
    }
    mockUsers.splice(userIndex, 1);
  },
};
