/**
 * Express Request 类型扩展
 *
 * 问题：RequestLoggerMiddleware 把 requestId 塞到 req 上，但 TS 不认。
 * 解决：用 module augmentation 告诉 TS "Request 上有 requestId 属性"
 *
 * 关键：
 *   - .d.ts 文件（声明文件，不编译成 JS）
 *   - declare global { namespace Express { interface Request { ... } } }
 *   - tsconfig 里的 include 自动覆盖
 *
 * 真实项目里类似扩展很常见（user、tenant、traceId、locale 等）
 */
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      // AuthGuard 鉴权通过后会把 user 塞到 req.user
      // 这是 Passport.js / NestJS 生态的约定，TS 默认不认
      user?: { id: number; name: string };
    }
  }
}

export {};
