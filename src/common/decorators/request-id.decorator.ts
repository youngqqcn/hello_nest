import { ExecutionContext, createParamDecorator } from '@nestjs/common';

/**
 * @RequestId() 参数装饰器 —— 从 request 对象里取出 requestId
 *
 * 用法：
 *   someHandler(@RequestId() requestId: string) { ... }
 *
 * createParamDecorator 的工作原理：
 *   装饰器工厂返回一个 (data, ctx) => any 函数
 *   NestJS 在调用 handler 前调这个函数，把返回值当参数传给 handler
 */
export const RequestId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.requestId ?? 'unknown';
  },
);
