// Common API response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    message: string;
    stack?: string;
  };
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationInfo;
}

// User related types
export interface UserRegistrationData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UserLoginData {
  email: string;
  password: string;
}

export interface UserUpdateData {
  username?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
}

export interface UserPublicData {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  bio?: string;
  role: 'user' | 'admin';
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  user: UserPublicData;
  token: string;
}

// Query parameters
export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}