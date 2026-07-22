import { v4 as uuidv4 } from 'uuid';

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const users: UserRecord[] = [];

export function listUsers() {
  return users;
}

export function findUserByEmail(email: string) {
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

export function createUser(input: Omit<UserRecord, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date().toISOString();
  const user: UserRecord = {
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
    ...input
  };
  users.push(user);
  return user;
}
