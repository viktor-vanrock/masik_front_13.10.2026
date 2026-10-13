import type { UserRole } from './auth';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  email?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminUsersListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortColumn?: 'createdAt' | 'username' | 'role';
  sortDirection?: 'ASC' | 'DESC';
}

export interface AdminUsersListResponse {
  data: User[];
  total: number;
}

export interface CreateAdminUserDto {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateAdminUserDto {
  username?: string;
  email?: string;
  password?: string;
  role?: UserRole;
}
