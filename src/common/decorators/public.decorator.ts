import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator to mark routes as public (skip JWT authentication)
 * @example
 * @Public()
 * @Get('health')
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
