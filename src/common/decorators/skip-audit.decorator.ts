import { SetMetadata } from '@nestjs/common';
import { SKIP_AUDIT } from '../../core/interceptors/audit.interceptor';

/**
 * Decorator to skip audit logging for a specific route
 * Usage: @SkipAudit()
 */
export const SkipAudit = () => SetMetadata(SKIP_AUDIT, true);
