import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestId } from '../common/decorators/request-id.decorator';

/**
 * AuthController —— 演示 4 大切面的实战场景
 *
 * 路由 1: POST /auth/login  → @Public() 跳过鉴权
 * 路由 2: GET  /auth/me     → AuthGuard 强制鉴权 + @CurrentUser 拿 user
 *
 * 这是你以后做的"用户系统"的最小骨架
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─── 公开路由：不用鉴权 ───
  @Public()  // ← AuthGuard 看到这个标记就放行
  @Post('login')
  login(@Body() body: { name: string }) {
    return this.authService.login(body.name);
  }

  // ─── 私有路由：必须鉴权 ───
  @Get('me')
  me(
    @CurrentUser() user: { id: number; name: string },  // ← AuthGuard 把 user 塞到 req
    @RequestId() requestId: string,                     // ← Middleware 塞的 requestId
  ) {
    return {
      user,
      requestId,
      message: '你看到了这个说明鉴权成功！',
    };
  }
}
