export type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
};

export type CreateUserInput = Omit<User, 'id'>;
