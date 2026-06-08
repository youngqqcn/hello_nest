import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthService } from '../../auth/auth.service';

/**
 * AuthGuard —— API Key 鉴权（演示用）
 *
 * 工作流：
 *   1. 用 Reflector 读 @Public() 元数据；公开路由直接放行
 *   2. 从 request.header['x-api-key'] 拿 API key
 *   3. 调 AuthService.findByApiKey() 验证（你写的时候要正确处理三种情况）
 *   4. 验证通过 → 把 user 塞到 req.user；失败 → 抛 UnauthorizedException
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // ── 步骤 1：检查 @Public() ──
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), // 当前方法上的 @Public
      context.getClass(), // 当前 Controller 上的 @Public
    ]);
    if (isPublic) {
      return true;
    }

    // ── 步骤 2：拿 API Key ──
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.header('x-api-key');

    // ── 步骤 3-4：API Key 验证（你来写） ──
    // 提示：
    //   1. 如果 apiKey 不存在 → throw new UnauthorizedException('缺少 x-api-key header')
    //   2. 调 this.authService.findByApiKey(apiKey) 拿 user
    //   3. 如果 user 不存在 → throw new UnauthorizedException('API Key 无效')
    //   4. 否则 → 把 user 塞到 request.user 上
    //        request.user = { id: user.id, name: user.name };
    //      然后 return true
    if (!apiKey) {
      throw new UnauthorizedException('缺少 x-api-key header');
    }
    const user = this.authService.findByApiKey(apiKey);
    if (!user) {
      throw new UnauthorizedException('API Key 无效');
    }
    request.user = { id: user.id, name: user.name };

    return true;
  }
}
