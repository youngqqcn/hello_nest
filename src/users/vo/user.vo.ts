import { Exclude, Expose } from 'class-transformer';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *   UserVo —— 用户实体对外暴露的视图对象（Response DTO / View Object）
 *
 *   核心理念：
 *     - VO 是"白名单"：只有显式 @Expose() 的字段才会出现在响应里
 *     - 没声明的字段（包括 password）默认被剥离
 *     - 这跟 DTO 是镜像关系：DTO 防输入注入，VO 防输出泄露
 *
 *   工作机制（背景知识）：
 *     1. Controller 返回 UserVo 实例
 *     2. ClassSerializerInterceptor 拦截响应
 *     3. 调 class-transformer 的 instanceToPlain()
 *     4. 配合 excludeExtraneousValues: true（在 main.ts 配置），
 *        只保留 @Expose 标记的字段
 *
 *   思考题（写之前想一下）：
 *     Q: 如果一个未来加的字段（比如 phone）忘记加 @Expose，
 *        它会出现在 API 响应里吗？这种"默认拒绝"的设计有什么安全价值？
 * ═══════════════════════════════════════════════════════════════════════════
 */
/**
 * 类级别 @Exclude()：默认排除所有字段
 *   ↓
 * 字段级别 @Expose()：显式白名单允许
 *   = 真正的"默认拒绝 + 显式允许"安全模式
 *
 * 这种"类级 + 字段级"双层声明比全局 strategy 选项更可控、更显式。
 */
@Exclude()
export class UserVo {
  // ─── TODO #1：暴露 id 字段 ─────────────────────────────────────
  // 提示：
  //   @Expose()
  //   id: number;
  @Expose()
  id: number;

  // ─── TODO #2：暴露 email 字段 ─────────────────────────────────
  @Expose()
  email: string;

  // ─── TODO #3：暴露 name 字段 ──────────────────────────────────
  @Expose()
  name: string;

  // ⚠️ 注意：故意 *不* 声明 password 字段！
  //    "没声明 + excludeExtraneousValues: true" = 默认被剥离
  //    这是"白名单"安全模式的精髓

  /**
   * 构造函数：方便从 Entity 一键构造 VO
   * 用法：new UserVo(userRecord)
   *
   * Object.assign 把 partial 的所有字段拷贝到 this 上 ——
   * 但因为 class-transformer 走白名单，多拷过来的也无所谓。
   */
  constructor(partial: Partial<UserVo>) {
    Object.assign(this, partial);
  }
}
