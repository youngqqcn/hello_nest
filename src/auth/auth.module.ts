import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  // ─── 关键：导出 AuthService 让 AuthGuard 能注入 ───
  // 但 AuthGuard 在 common/ 里，不是这个 module
  // 我们把 AuthGuard 放在 AppModule（全局）注册，更合适
  exports: [AuthService],
})
export class AuthModule {}
