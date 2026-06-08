import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { BookRecord } from './entities/book.entity';

/**
 * 教学版 books 服务 —— 内存数组存储
 * 跟 UsersService 模式一致
 *
 * 注意：所有方法都返回 *完整* BookRecord（含 internalNote 等敏感字段）
 * Controller 负责转成 BookVo 出门时再脱敏
 */
@Injectable()
export class BooksService {
  private books: BookRecord[] = [];
  private nextId = 1;

  create(dto: CreateBookDto): BookRecord {
    const book: BookRecord = {
      id: this.nextId++,
      title: dto.title,
      author: dto.author,
      isbn: dto.isbn,
      publishedYear: dto.publishedYear,
      pages: dto.pages,
      description: dto.description,
      createdAt: new Date(),
      // internalNote 故意不初始化 —— 演示"可选敏感字段"
    };
    this.books.push(book);
    return book;
  }

  findAll(): BookRecord[] {
    return this.books;
  }

  findOne(id: number): BookRecord {
    const book = this.books.find((b) => b.id === id);
    if (!book) {
      throw new NotFoundException(`Book with id ${id} not found`);
    }
    return book;
  }

  /**
   * PATCH 语义：只更新传入的字段
   * 注意：故意禁止更新 internalNote —— 它应该走"内部编辑"接口
   *       （真实项目会拆分成两个 Controller）
   */
  update(id: number, dto: UpdateBookDto): BookRecord {
    const book = this.findOne(id); // 自动抛 404 如果不存在
    Object.assign(book, dto);
    return book;
  }

  remove(id: number): { deletedId: number } {
    const index = this.books.findIndex((b) => b.id === id);
    if (index === -1) {
      throw new NotFoundException(`Book with id ${id} not found`);
    }
    this.books.splice(index, 1);
    return { deletedId: id };
  }
}
