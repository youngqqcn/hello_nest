import { ClassSerializerInterceptor } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ──────────────────────────────────────────────────────────────
  // 全局 ClassSerializerInterceptor —— 响应序列化（VO 装饰器生效）
  //   这是全局的，BooksController 和 UsersController 都要用
  // ──────────────────────────────────────────────────────────────
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // ──────────────────────────────────────────────────────────────
  // 注意：ValidationPipe 不再挂在全局！
  //
  // 改成"局部挂载"：
  //   - UsersController: @UsePipes(new ValidationPipe({...}))  ← class-validator
  //   - BooksController: @UsePipes(new ZodValidationPipe())    ← zod
  //
  // 原因：如果全局 ValidationPipe 跟局部 ZodValidationPipe 同时存在，
  //      全局那个会"先"跑，破坏 zod 期望的原始请求体格式。
  //      把 class-validator 移到 UsersController 局部后，两套验证彻底分离。
  // ──────────────────────────────────────────────────────────────

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
