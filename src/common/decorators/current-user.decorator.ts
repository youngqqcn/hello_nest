import { ExecutionContext, createParamDecorator } from '@nestjs/common';

/**
 * @CurrentUser() 参数装饰器 —— 从 request.user 取出当前登录用户
 *
 * 用法：
 *   someHandler(@CurrentUser() user: { id: number; name: string }) { ... }
 *   someHandler(@CurrentUser('id') userId: number) { ... }   ← 还能取子字段
 *
 * AuthGuard 鉴权通过后，把 user 塞到 req.user 上
 * Controller 直接用这个装饰器拿，不用每次写 ctx.switchToHttp() 那串
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
