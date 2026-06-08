/**
 * ═══════════════════════════════════════════════════════════════════════════
 *   CreateUserDto —— 接收 POST /users 请求体的"形状契约"
 *
 *   这是今天最重要的练习。每个字段你都要做两个决定：
 *     1. 字段类型是什么（TS 类型）
 *     2. 字段的合法范围是什么（class-validator 装饰器）
 *
 *   class-validator 常用装饰器速查（不需要全用，按需选）：
 *     @IsEmail()                      合法邮箱
 *     @IsString()                     必须是字符串
 *     @IsNotEmpty()                   非空（不能是空字符串）
 *     @IsOptional()                   可选字段（缺省时跳过其他验证）
 *     @MinLength(n) / @MaxLength(n)   字符串长度上下限
 *     @Matches(/regex/, { message })  正则匹配（密码强度规则可用）
 *     @IsInt() / @Min(n) / @Max(n)    整数范围
 *     @IsEnum(MyEnum)                 枚举值之一
 *
 *   一个装饰器示例（让你看语法长什么样）：
 *     @IsEmail({}, { message: 'email 格式不对' })
 *     email: string;
 *
 *   完整文档：https://github.com/typestack/class-validator#validation-decorators
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

// ─── TODO #1：从 class-validator 引入你要用的装饰器 ───────────────
// 比如：
//   import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
//
// 提示：用什么导入什么，没用的不要导（ESLint 会警告）

export class CreateUserDto {
  // ─── TODO #2：定义 email 字段 + 验证 ─────────────────────────────
  // 业务规则：必须是合法邮箱
  @IsEmail({}, { message: 'email 格式不对' })
  email: string;

  // ─── TODO #3：定义 name 字段 + 验证 ──────────────────────────────
  // 业务规则（请你做决定）：
  //   - 必须是字符串
  //   - 长度范围你说了算（建议 2-30）
  //   - 是否允许空格？是否限制只能字母？—— 自由发挥
  //   思考：业务上"name"该多严？太严会拒绝合法用户（"李雷"两字），
  //         太松会让垃圾数据进库。这是真实工程权衡。
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(30)
  name: string;

  // ─── TODO #4：定义 password 字段 + 验证 ──────────────────────────
  // 业务规则（请你做决定）：
  //   - 必须是字符串
  //   - 最小长度（行业惯例 8 或更多）
  //   - 进阶（可选）：用 @Matches 强制包含字母+数字
  //     例：@Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, { message: '密码必须包含字母和数字' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 思考题（写代码前先想清楚）：
 *
 *   Q1. 为什么 DTO 用 class 而不是 interface？
 *       提示：装饰器只能贴在 class 上，运行时验证需要 class 的元数据。
 *
 *   Q2. 验证逻辑写在 DTO 上（声明式），跟"写在 Controller 里手动 if-else"
 *       （命令式）相比，有什么优势？
 *
 *   Q3. 如果有人发了 { email: 'a@b.com', password: 'xxx', isAdmin: true }
 *       —— 多带了一个未声明的 isAdmin 字段，会发生什么？
 *       （提示：这跟 ValidationPipe 的 whitelist / forbidNonWhitelisted 选项有关）
 * ═══════════════════════════════════════════════════════════════════════════
 */
