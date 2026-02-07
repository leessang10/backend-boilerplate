import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for a route
 * @param roles - Array of required roles
 * @example
 * @Roles(Role.ADMIN, Role.MODERATOR)
 * @Get('admin')
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
