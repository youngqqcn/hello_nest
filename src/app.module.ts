import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerService } from './logger.service';
import { UsersModule } from './users/users.module';
import { BooksModule } from './books/books.module';
import { AuthModule } from './auth/auth.module';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { AuthGuard } from './common/guards/auth.guard';

/**
 * AppModule —— 4 大切面在这里"装配"
 *
 * Middleware  → configure(consumer) 里挂
 * Guard       → 用 APP_GUARD token（走 DI，能注入 AuthService）
 * Interceptor → 在 main.ts 全局挂
 * Filter      → 在 main.ts 全局挂
 */
@Module({
  imports: [UsersModule, BooksModule, AuthModule],
  controllers: [AppController],
  providers: [
    AppService,
    LoggerService,
    // ── 全局 AuthGuard：用 APP_GUARD token 让 Nest 用 DI 实例化 ──
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  // ── Middleware 必须用 configure() 挂（NestJS API） ──
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*'); // * = 所有路由
  }
}
