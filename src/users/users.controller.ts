import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Post,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserVo } from './vo/user.vo';

/**
 * UsersController —— 走 class-validator 验证链路
 *
 * 关键改造：从 main.ts 全局移到 Controller 局部
 *   - 全局 ValidationPipe 已移除（跟 BooksController 的 ZodValidationPipe 冲突）
 *   - 现在 UsersController 自己挂 ValidationPipe，BooksController 自己挂 ZodValidationPipe
 *   - 两套验证彻底分离，互不干扰
 */
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto): UserVo {
    const record = this.usersService.create(dto);
    return new UserVo(record);
  }

  @Get(':id')
  findOne(@Param('id') id: number): UserVo {
    const record = this.usersService.findOne(id);
    return new UserVo(record);
  }
}
