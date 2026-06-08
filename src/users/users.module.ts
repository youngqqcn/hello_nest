import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

/**
 * UsersModule 是一个"功能模块" —— 把相关的 Controller/Service 聚合在一起。
 *
 * 这是 NestJS 推荐的代码组织方式：
 *   - app.module 只做"应用根模块"，负责拼装各功能模块
 *   - 每个功能模块（users / orders / payments...）自成一个目录
 *   - 模块边界 = 团队边界 = 部署边界（微服务化时直接切走）
 */
@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
