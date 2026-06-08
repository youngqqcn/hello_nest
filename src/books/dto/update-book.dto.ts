import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { CreateBookSchema } from './create-book.dto';

/**
 * UpdateBookDto —— 用 zod 派生 PATCH 语义
 *
 * zod 4 踩坑记录：
 *   `CreateBookSchema.partial()` 直接返回的 schema 在 zod 4 下不是 ZodObject
 *   （_def.typeName 是 undefined），ZodValidationPipe 跟它交互有 bug。
 *
 * 修法：用 z.object() 显式包一层 → 强制得到 ZodObject → 再 .partial()
 *   z.object(CreateBookSchema.shape) 等价于重新创建一个 ZodObject
 *   .partial()  再把每个字段变成 optional
 */
export const UpdateBookSchema = z.object(CreateBookSchema.shape).partial();

export class UpdateBookDto extends createZodDto(UpdateBookSchema) {}
