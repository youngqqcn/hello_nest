import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * AllExceptionsFilter —— 统一异常兜底
 *
 * 捕获所有异常（HttpException + 未知异常）并返回统一格式：
 *   {
 *     success: false,
 *     error: { code, message, details? },
 *     meta: { requestId, timestamp, path }
 *   }
 *
 * 它跟 ResponseWrapperInterceptor 是"对称"的：
 *   - Interceptor 包装成功响应
 *   - Filter 包装错误响应
 *
 * 真实项目里你会做：
 *   - 区分业务异常（HttpException）跟系统异常（Error）
 *   - zod 错误识别 + 友好格式
 *   - 敏感信息过滤（不要把 stack trace 暴露给客户端）
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();
    const requestId = request.requestId ?? 'unknown';
    const path = request.originalUrl;

    // ── 1. 判断异常类型，决定 status code 和 error code ──
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message: string = 'Internal server error';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        // NestJS HttpException 的默认结构：{ message, error, statusCode }
        // zod 错误可能是：{ statusCode, message: 'Validation failed', errors: [...] }
        message = (body as any).message ?? exception.message;
        details = (body as any).errors ?? (body as any).details;
      }
      code = this.codeFromStatus(status);
    } else if (exception instanceof Error) {
      message = exception.message;
      // ── 生产环境不暴露 stack 给客户端 ──
      // details = exception.stack  // 仅在开发环境
    }

    // ── 2. 服务端日志（带 requestId 方便追踪） ──
    this.logger.error(
      `[${requestId.slice(0, 8)}] ${request.method} ${path} ${status} → ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    // ── 3. 统一响应格式 ──
    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        path,
      },
    });
  }

  /** 把 HTTP 状态码映射成业务错误码（前端能识别的"code"） */
  private codeFromStatus(status: number): string {
    switch (status) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 422:
        return 'UNPROCESSABLE_ENTITY';
      case 500:
        return 'INTERNAL_ERROR';
      default:
        return `HTTP_${status}`;
    }
  }
}
