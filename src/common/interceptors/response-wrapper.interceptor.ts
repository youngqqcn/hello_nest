import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

/**
 * ResponseWrapperInterceptor —— 统一响应包装
 *
 * 把所有 handler 返回值包成标准结构：
 *   {
 *     success: true,
 *     data: <原始返回值>,
 *     meta: { requestId, timestamp, duration }
 *   }
 *
 * 这就是"前后端约定"的真实工程化实践——前端永远解析同一个外壳
 *
 * 关键技术点：
 *   - 包装前：记录 start time（用于算 duration）
 *   - pipe(map) 是"后置"：handler 返回后做事
 *   - pipe(catchError) 是"异常后"：错误时也打印日志（不重写异常）
 *   - tap 不会改变流（用于副作用）
 */
@Injectable()
export class ResponseWrapperInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpCtx = context.switchToHttp();
    const request = httpCtx.getRequest<Request & { requestId?: string }>();
    const requestId = request.requestId ?? 'unknown';
    const start = Date.now();

    return next.handle().pipe(
      // ── 前置副作用：进入 handler 前的日志（可选，目前用 tap 不做事） ──
      tap({ next: () => undefined }),

      // ── 后置：包装返回值 ──
      map((data) => {
        const duration = Date.now() - start;
        return {
          success: true,
          data,
          meta: {
            requestId,
            timestamp: new Date().toISOString(),
            duration: `${duration}ms`,
          },
        };
      }),

      // ── 异常时：也记录耗时，让 AllExceptionsFilter 拿到 status ──
      catchError((err) => {
        const duration = Date.now() - start;
        // 把 duration 附到 err 上，让 ExceptionFilter 可以读取
        err.duration = duration;
        return throwError(() => err);
      }),
    );
  }
}
