import { SetMetadata } from '@nestjs/common';

/**
 * @Public() 装饰器 —— 标记"这个路由不需要鉴权"
 *
 * 用法：
 *   @Public()
 *   @Post('login')
 *   login() { ... }
 *
 * 实现原理：
 *   SetMetadata('isPublic', true)  // 把"是公开路由"这个信息存到路由的元数据上
 *   AuthGuard 用 Reflector 读这个元数据判断
 *
 * 这是 NestJS 元数据编程的经典用法：装饰器 + Reflector
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
