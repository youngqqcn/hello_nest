/**
 * Book 的"内部表示" —— 对应数据库的一条记录
 * （教学版用内存存储，但字段形状应该跟真实 DB 一致）
 *
 * 跟 UserVo 的关系：Service 内部流转的是这个形状
 *                  Controller 出门口才转成 BookVo 脱敏
 */
export interface BookRecord {
  id: number;

  // ─── 客户端提供的字段（CreateBookDto 也有）───
  title: string;
  author: string;
  isbn: string;
  publishedYear: number;
  pages?: number; // 可选字段
  description?: string;

  // ─── 服务器/数据库自动生成、客户端不需要看到的字段 ───
  createdAt: Date;

  // ─── 🚨 内部敏感字段 —— 这就是 VO 存在的理由 ───
  //   真实场景示例：
  //     - internalNote: 编辑部内部备注（"这本书是新人翻译，质量需复查"）
  //     - cost: 内部进货成本（不能告诉前端）
  //     - isDraft: 是否未发布草稿
  //     - deletedAt: 软删除时间戳
  //
  //   这个字段 BookVo 必须过滤掉，否则就像 users 里 password 泄露一样
  internalNote?: string;
}
