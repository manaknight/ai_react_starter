import { User, CreateUserInput } from '../types';

export interface UserService {
  list(): Promise<User[]>;
  get(id: string): Promise<User>;
  create(input: CreateUserInput): Promise<User>;
  update(id: string, input: Partial<CreateUserInput>): Promise<User>;
  delete(id: string): Promise<void>;
}
