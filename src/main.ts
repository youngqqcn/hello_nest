import { ClassSerializerInterceptor } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseWrapperInterceptor } from './common/interceptors/response-wrapper.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ─── 全局 ClassSerializerInterceptor（保留 @Exclude/@Expose 脱敏） ───
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // ─── 全局 ResponseWrapperInterceptor（统一响应包装） ───
  // 多个 Interceptor 按注册顺序执行——先脱敏再包装
  app.useGlobalInterceptors(new ResponseWrapperInterceptor());

  // ─── 全局 AllExceptionsFilter（统一异常兜底） ───
  // AllExceptionsFilter 构造函数无参（不需要 HttpAdapterHost）
  app.useGlobalFilters(new AllExceptionsFilter());

  // ─── 注意：AuthGuard 不在 main.ts 全局挂 ───
  // 原因：AuthGuard 依赖 AuthService，要走 DI 容器
  //   所以 AuthGuard 用 APP_GUARD token 在 AppModule 注册（看 app.module.ts）

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
