import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { BooksService } from './books.service';
import { CreateBookDto, CreateBookSchema } from './dto/create-book.dto';
import { UpdateBookDto, UpdateBookSchema } from './dto/update-book.dto';
import { BookVo } from './vo/book.vo';

/**
 * 关键修正（按 NestJS 中文文档 https://docs.nestjs.cn/overview/pipes）：
 *
 *   ❌ 方法级 @UsePipes(new ZodValidationPipe(schema))
 *      问题：会对方法的所有参数都跑（body、query、param 都跑）
 *      @Param('id', ParseIntPipe) id: number 拿到的 string '1'
 *      也会被 zod 用 UpdateBookSchema 验证 → 报"expected object, received string"
 *
 *   ✅ 参数级 @Body(new ZodValidationPipe(schema))
 *      只对 @Body() 这个参数生效，不会干扰 @Param
 */
@Controller('books')
@UseInterceptors(ClassSerializerInterceptor)
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(CreateBookSchema)) dto: CreateBookDto,
  ): BookVo {
    return new BookVo(this.booksService.create(dto));
  }

  @Get()
  findAll(): BookVo[] {
    return this.booksService.findAll().map((b) => new BookVo(b));
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): BookVo {
    return new BookVo(this.booksService.findOne(id));
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateBookSchema)) dto: UpdateBookDto,
  ): BookVo {
    return new BookVo(this.booksService.update(id, dto));
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.booksService.remove(id);
  }
}
