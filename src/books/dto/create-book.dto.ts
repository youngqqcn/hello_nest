import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *   Books 模块的 DTO 全部用 Zod —— 跟 Users 模块的 class-validator 并存
 *
 *   关键理解：
 *     - CreateBookSchema 是「单一真相源」(SSOT)
 *     - 类型从 schema 推导：z.infer<typeof CreateBookSchema>
 *     - createZodDto 把 schema 包装成 NestJS 能识别的 class
 *     - UpdateBookDto 用 schema.partial() 派生 —— 一行替代 class-validator 的 PartialType
 *
 *   对比 Users 的 class-validator 风格（记忆锚点）：
 *     class-validator:    @IsEmail() email: string    ← 装饰器 + 字段类型
 *     zod:                email: z.string().email()   ← 函数式 + 链式
 *
 *   Zod 4 常用 API 速查（你写代码时可以参考）：
 *     z.string()                        字符串
 *     z.string().min(2).max(30)         长度上下限
 *     z.string().email()                邮箱
 *     z.string().url()                  URL
 *     z.string().regex(/pattern/)       自定义正则
 *     z.string().toLowerCase()          验证后自动转换
 *     z.number()                        数字
 *     z.number().int()                  整数
 *     z.number().min(0).max(2030)       数值范围
 *     z.number().positive()             正数
 *     z.number().optional()             可选（这跟 .optional() 写在链尾是同效的）
 *     z.enum(['x', 'y'])                枚举
 *     z.array(z.string())               字符串数组
 *     z.array(z.string()).min(1)        数组至少 1 个
 *     z.object({ a: z.string(), b: z.number() })  嵌套对象
 *     z.iso.date()                      ISO 8601 日期字符串（zod 4 新）
 *     z.iso.datetime()                  ISO 8601 datetime
 *     z.coerce.number()                 强制转数字（适合 URL 里的 string）
 *     z.literal('hello')                字面量值
 *     z.union([z.string(), z.number()]) 联合类型
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ─── 必填字段（你来设计） ──────────────────────────────────────────
export const CreateBookSchema = z.object({
  // ─── TODO #1：title 字段 ────────────────────────────────────
  // 要求（你做决定）：
  //   - 必填
  //   - 长度 1-200 字符
  //   - 是否自动 trim / toLowerCase？（Zod 4 链式调用支持）
  title: z.string().min(1).max(200).toLowerCase(),

  // ─── TODO #2：author 字段 ───────────────────────────────────
  // 要求：
  //   - 必填
  //   - 长度 1-100
  author: z.string().min(1).max(100).toLowerCase(),

  // ─── TODO #3：isbn 字段 ─────────────────────────────────────
  // 要求：
  //   - 必填
  //   - 用 .regex() 验证 ISBN-10 (10 位数字) 或 ISBN-13 (13 位数字)
  //     例：.regex(/^(\d{10}|\d{13})$/, { error: '必须是 ISBN-10 或 ISBN-13' })
  isbn: z
    .string()
    .regex(/^(\d{10}|\d{13})$/, { error: '必须是 ISBN-10 或 ISBN-13' }),

  // ─── TODO #4：publishedYear 字段 ────────────────────────────
  // 要求：
  //   - 必填
  //   - 整数
  //   - 范围 0~2030
  publishedYear: z.number().int().min(0).max(2030),

  // ─── TODO #5：pages 字段（可选） ────────────────────────────
  // 要求：
  //   - 可选（用 .optional()）
  //   - 整数
  //   - 至少 1 页
  pages: z.number().int().min(1).optional(),

  // ─── TODO #6：description 字段（可选） ──────────────────────
  // 要求：
  //   - 可选
  //   - 最多 2000 字符
  //   - 思考：要不要 .default('') 给个空串默认值？还是让客户端真不传？
  description: z.string().max(2000).optional(),
});

// ─── createZodDto —— 把 schema 包成 NestJS 能识别的 class ─────────
// 这一行的意思是："用上面这个 schema 来验证和定型"
export class CreateBookDto extends createZodDto(CreateBookSchema) {}

/**
 * 思考题（写之前想一下）：
 *
 *   Q1. 跟我们昨天 Users 模块的 class-validator 风格比，Zod 风格"少写了什么"？
 *       （提示：类型、验证规则、运行时框架——三件套里 Zod 帮你做了几件？）
 *
 *   Q2. 如果用 zod 实现"电话格式（手机号 + 国际号）"这种 union 验证，
 *       z.union([...]) 怎么写？class-validator 怎么写？哪个更简洁？
 *
 *   Q3. Zod 4 跟 Zod 3 相比，number().int() 还能用吗？
 *       提示：zod 4 引入了 z.int()、z.string().min() 还可以链式。
 *       （这是个开放题，欢迎你搜索一下 zod 4 的新特性）
 */
