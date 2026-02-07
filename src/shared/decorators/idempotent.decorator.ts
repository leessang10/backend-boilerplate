import { SetMetadata } from '@nestjs/common';

export const IDEMPOTENT = 'idempotent';

/**
 * Mark a route as idempotent
 * This is currently informational - the middleware checks all POST/PUT/PATCH requests
 * Usage: @Idempotent()
 */
export const Idempotent = () => SetMetadata(IDEMPOTENT, true);
