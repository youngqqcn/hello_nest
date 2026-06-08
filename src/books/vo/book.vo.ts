import { Exclude, Expose } from 'class-transformer';

/**
 * BookVo —— 跟 UserVo 完全对称的"白名单"模式
 *
 * 对比 Entity / DTO / VO：
 *   - BookEntity (BookRecord)   含 internalNote（编辑内部备注，敏感）
 *   - CreateBookDto             不含 internalNote（客户端不传）
 *   - BookVo                    显式 Expose 公开字段，internalNote 默认被剥
 */
@Exclude()
export class BookVo {
  @Expose()
  id: number;

  @Expose()
  title: string;

  @Expose()
  author: string;

  @Expose()
  isbn: string;

  @Expose()
  publishedYear: number;

  @Expose()
  pages?: number;

  @Expose()
  description?: string;

  @Expose()
  createdAt: Date;

  // ⚠️ internalNote 没声明 → 被 @Exclude 默认剥除
  //   即使 Service 把它返回了 BookVo 也不会泄露给客户端

  constructor(partial: Partial<BookVo>) {
    Object.assign(this, partial);
  }
}
