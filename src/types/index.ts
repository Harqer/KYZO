export interface User {
  id: string;
  clerkId?: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  image?: string;
  itemsCount: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Look {
  id: string;
  userId: string;
  collectionId?: string;
  title: string;
  description?: string;
  imageUrl: string;
  tags: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Model {
  id: string;
  userId: string;
  name: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Request {
  user?: User;
}

export interface ClerkAuthRequest extends Request {
  auth?: {
    userId: string;
    sessionId?: string;
    session?: {
      createdAt: string;
      expiresAt: string;
    };
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}
