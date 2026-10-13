export type UserRole = 'USER' | 'ADMIN' | 'SUPERUSER';

export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  password: string;
  email: string;
}

/**
 * Shared success envelope for auth mutations (login/register/logout).
 * The JWT lives only in a backend-managed HttpOnly cookie — never in the body.
 */
export interface AuthSuccessResponse {
  success: boolean;
}

/**
 * Standard NestJS error envelope.
 */
export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
  usageCount?: number;
  code?: string;
  deletedId?: string;
}
