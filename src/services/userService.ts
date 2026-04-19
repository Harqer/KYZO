import { User } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Mock database for now - in production, this would be replaced with a real database
let users: User[] = [];

export class UserService {
  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const user: User = {
      id: uuidv4(),
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    users.push(user);
    return user;
  }

  async findById(id: string): Promise<User | null> {
    return users.find(user => user.id === id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return users.find(user => user.email === email) || null;
  }

  async update(id: string, userData: Partial<User>): Promise<User | null> {
    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex === -1) return null;

    users[userIndex] = {
      ...users[userIndex],
      ...userData,
      updatedAt: new Date(),
    };

    return users[userIndex];
  }

  async delete(id: string): Promise<boolean> {
    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex === -1) return false;

    users.splice(userIndex, 1);
    return true;
  }

  async findAll(): Promise<User[]> {
    return users;
  }
}
