import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to get current user from request
 * @example
 * @Get('me')
 * getProfile(@CurrentUser() user: User) {
 *   return user;
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const contextType = ctx.getType<'http' | 'ws' | 'rpc'>();

    if (contextType === 'http') {
      const request = ctx.switchToHttp().getRequest();
      return request.user;
    }

    if (contextType === 'ws') {
      const client = ctx.switchToWs().getClient<{ user?: unknown }>();
      return client.user;
    }

    return undefined;
  },
);
