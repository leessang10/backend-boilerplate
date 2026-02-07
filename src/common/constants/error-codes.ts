export enum ErrorCode {
  // Authentication & Authorization
  AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
  AUTH_FORBIDDEN = 'AUTH_FORBIDDEN',
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID',
  AUTH_USER_INACTIVE = 'AUTH_USER_INACTIVE',

  // User
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  USER_EMAIL_IN_USE = 'USER_EMAIL_IN_USE',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',

  // Database
  DATABASE_ERROR = 'DATABASE_ERROR',
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',

  // File Upload
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  FILE_TYPE_NOT_ALLOWED = 'FILE_TYPE_NOT_ALLOWED',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Feature Flag
  FEATURE_DISABLED = 'FEATURE_DISABLED',
  FEATURE_NOT_FOUND = 'FEATURE_NOT_FOUND',

  // Idempotency
  DUPLICATE_REQUEST = 'DUPLICATE_REQUEST',

  // General
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  BAD_REQUEST = 'BAD_REQUEST',
  NOT_FOUND = 'NOT_FOUND',
}

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.AUTH_UNAUTHORIZED]: 'Authentication required',
  [ErrorCode.AUTH_FORBIDDEN]: 'Insufficient permissions',
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password',
  [ErrorCode.AUTH_TOKEN_EXPIRED]: 'Token has expired',
  [ErrorCode.AUTH_TOKEN_INVALID]: 'Invalid token',
  [ErrorCode.AUTH_USER_INACTIVE]: 'User account is inactive',

  [ErrorCode.USER_NOT_FOUND]: 'User not found',
  [ErrorCode.USER_ALREADY_EXISTS]: 'User already exists',
  [ErrorCode.USER_EMAIL_IN_USE]: 'Email address is already in use',

  [ErrorCode.VALIDATION_ERROR]: 'Validation failed',
  [ErrorCode.INVALID_INPUT]: 'Invalid input data',

  [ErrorCode.DATABASE_ERROR]: 'Database operation failed',
  [ErrorCode.RECORD_NOT_FOUND]: 'Record not found',
  [ErrorCode.DUPLICATE_ENTRY]: 'Duplicate entry',

  [ErrorCode.FILE_TOO_LARGE]: 'File size exceeds limit',
  [ErrorCode.FILE_TYPE_NOT_ALLOWED]: 'File type not allowed',
  [ErrorCode.FILE_UPLOAD_FAILED]: 'File upload failed',

  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests',

  [ErrorCode.FEATURE_DISABLED]: 'Feature is currently disabled',
  [ErrorCode.FEATURE_NOT_FOUND]: 'Feature flag not found',

  [ErrorCode.DUPLICATE_REQUEST]: 'Duplicate request detected',

  [ErrorCode.INTERNAL_SERVER_ERROR]: 'Internal server error',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
  [ErrorCode.BAD_REQUEST]: 'Bad request',
  [ErrorCode.NOT_FOUND]: 'Resource not found',
};
